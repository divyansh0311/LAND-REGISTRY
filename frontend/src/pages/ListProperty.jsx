import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Web3 from "web3";
import PropertyContractABI from "../contracts/PropertyContract.json";

function ListProperty() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    size: "",
    bedrooms: "",
    bathrooms: "",
    price: "",
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convert numeric fields to numbers
    if (["size", "bedrooms", "bathrooms", "price"].includes(name)) {
      const numValue = value === "" ? "" : parseFloat(value);
      setFormData({
        ...formData,
        [name]: numValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const res = await axios.post(
        "http://localhost:5001/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // Update image URLs to use full backend URL
      const fullUrls = res.data.urls.map(
        (url) => `http://localhost:5001${url}`
      );
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...fullUrls],
      }));
    } catch (err) {
      setError("Error uploading images. Please try again.");
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    if (!formData.location.trim()) {
      setError("Location is required");
      return false;
    }
    if (!formData.size || formData.size <= 0) {
      setError("Size must be greater than 0");
      return false;
    }
    if (!formData.bedrooms || formData.bedrooms <= 0) {
      setError("Number of bedrooms must be greater than 0");
      return false;
    }
    if (!formData.bathrooms || formData.bathrooms <= 0) {
      setError("Number of bathrooms must be greater than 0");
      return false;
    }
    if (!formData.price || formData.price <= 0) {
      setError("Price must be greater than 0");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Check MetaMask
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to continue");
      }

      // Initialize Web3
      const web3 = new Web3(window.ethereum);

      // Request account access
      const accounts = await web3.eth.requestAccounts();
      if (!accounts.length) {
        throw new Error("No accounts found in MetaMask");
      }

      // Get network ID
      const networkId = await web3.eth.net.getId();
      console.log("Network ID:", networkId);

      // Get contract address for current network
      const contractAddress = PropertyContractABI.networks[networkId]?.address;
      if (!contractAddress) {
        throw new Error("Contract not deployed on this network");
      }

      // Initialize contract
      const contract = new web3.eth.Contract(
        PropertyContractABI.abi,
        contractAddress
      );

      // Convert price to Wei
      const priceInWei = web3.utils.toWei(formData.price.toString(), "ether");

      // Generate a unique property ID first
      const timestamp = Math.floor(Date.now() / 1000);
      const random = Math.floor(Math.random() * 1000000);
      const propertyId = timestamp * 1000000 + random;
      console.log("Generated property ID:", propertyId);

      // Create property in backend first
      try {
        console.log("Creating property in backend first...");
        const response = await axios.post(
          "http://localhost:5001/api/properties",
          {
            ...formData,
            price: formData.price,
            contractAddress: contractAddress,
            seller: user._id,
            status: "available",
            blockchainId: propertyId,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Backend response:", response.data);

        // List property on blockchain
        const tx = await contract.methods
          .listProperty(
            formData.title,
            formData.description,
            formData.location,
            formData.size,
            formData.bedrooms,
            formData.bathrooms,
            priceInWei
          )
          .send({
            from: accounts[0],
            gas: 5000000,
            gasPrice: web3.utils.toWei("20", "gwei"),
          });

        console.log("Listing transaction completed:", tx);

        // Update backend with transaction hash
        try {
          await axios.put(
            `http://localhost:5001/api/properties/${response.data._id}`,
            {
              transactionHash: tx.transactionHash,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
        } catch (updateErr) {
          console.error("Error updating transaction hash:", updateErr);
          // Continue with navigation even if update fails
        }

        // Create transaction record
        try {
          await axios.post(
            "http://localhost:5001/api/transactions",
            {
              propertyId: response.data._id,
              amount: formData.price,
              status: "completed",
              type: "listing",
              sellerId: user._id,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          );
        } catch (transactionErr) {
          console.error(
            "Error creating transaction record:",
            transactionErr.response?.data || transactionErr.message
          );
          // Continue with navigation even if transaction record fails
        }

        // Navigate to property details page
        navigate(`/properties/${response.data._id}`);
      } catch (err) {
        console.error("Error creating property:", err);
        if (err.response) {
          console.error("Backend error details:", err.response.data);
        }
        throw new Error("Failed to create property");
      }
    } catch (err) {
      console.error("Error listing property:", err);
      setError(err.message || "Error listing property. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "seller") {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">Only sellers can list properties.</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            List New Property
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="Enter property title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="input"
                    placeholder="Enter property description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="Enter property location"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size (sq ft)
                    </label>
                    <input
                      type="number"
                      name="size"
                      value={formData.size}
                      onChange={handleChange}
                      required
                      min="0"
                      step="1"
                      className="input"
                      placeholder="Enter property size"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (ETH)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="input"
                      placeholder="Enter property price"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      required
                      min="0"
                      step="1"
                      className="input"
                      placeholder="Enter bedrooms"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      required
                      min="0"
                      step="1"
                      className="input"
                      placeholder="Enter bathrooms"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Images
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="input"
                  />
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Property ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="text-red-500 text-center">{error}</div>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Listing..." : "List Property"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ListProperty;
