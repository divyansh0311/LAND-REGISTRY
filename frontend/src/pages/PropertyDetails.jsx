import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Web3 from "web3";
import contractABI from "../contracts/PropertyContract.json";

function PropertyDetails() {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [web3Error, setWeb3Error] = useState("");
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        console.log("Fetching property data...");
        const res = await axios.get(
          `http://localhost:5001/api/properties/${id}`
        );
        console.log("Received property data:", res.data);

        // Ensure all required fields exist with default values
        const propertyData = {
          _id: res.data._id || "",
          title: res.data.title || "Untitled Property",
          description: res.data.description || "No description available",
          price:
            typeof res.data.price === "string"
              ? parseFloat(res.data.price)
              : res.data.price || 0,
          status: res.data.status || "unknown",
          location: res.data.location || "Location not specified",
          size: res.data.size || 0,
          bedrooms: res.data.bedrooms || 0,
          bathrooms: res.data.bathrooms || 0,
          blockchainId: res.data.blockchainId || null,
          images: Array.isArray(res.data.images) ? res.data.images : [],
          seller: res.data.seller || null,
          buyer: res.data.buyer || null,
        };

        console.log("Processed property data:", propertyData);
        setProperty(propertyData);
      } catch (err) {
        console.error("Error fetching property:", err);
        setError("Error fetching property details. Please try again later.");
      } finally {
        setLoading(false);
        setProcessing(false);
      }
    };

    fetchProperty();
  }, [id]);

  // Function to list property on blockchain
  const handleListOnBlockchain = async () => {
    if (!property) {
      setWeb3Error("Property details not loaded");
      return;
    }

    try {
      setProcessing(true);
      setWeb3Error("");

      // 1. Check MetaMask
      if (!window.ethereum) {
        setWeb3Error("Please install MetaMask");
        return;
      }

      // 2. Connect to MetaMask
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      if (!accounts || accounts.length === 0) {
        setWeb3Error("Please connect your MetaMask wallet");
        return;
      }

      // 3. Get contract instance
      const networkId = await web3.eth.net.getId();
      const contractAddress = contractABI.networks[networkId]?.address;
      if (!contractAddress) {
        setWeb3Error("Contract not found on this network");
        return;
      }
      const contract = new web3.eth.Contract(contractABI.abi, contractAddress);

      // 4. Convert price to Wei
      const priceInWei = web3.utils.toWei(property.price.toString(), "ether");

      // 5. List the property
      console.log("Listing property on blockchain...");
      try {
        // Generate a unique property ID first
        const timestamp = Math.floor(Date.now() / 1000);
        const random = Math.floor(Math.random() * 1000000);
        const propertyId = timestamp * 1000000 + random;
        console.log("Generated property ID:", propertyId);

        // Update backend first with the generated ID
        try {
          console.log("Updating backend before listing...");
          const preListResponse = await axios.put(
            `http://localhost:5001/api/properties/${property._id}/transaction`,
            {
              blockchainId: propertyId,
              contractAddress: contractAddress,
              status: "available",
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json"
              },
            }
          );
          console.log(
            "Backend pre-list update response:",
            preListResponse.data
          );
        } catch (err) {
          console.error("Error updating backend before listing:", err);
          console.error("Response data:", err.response?.data);
          console.error("Status code:", err.response?.status);
          throw new Error(`Failed to update property status before listing: ${err.message}`);
        }

        // Now list the property on blockchain
        const tx = await contract.methods
          .listProperty(
            property.title,
            property.description,
            property.location,
            property.size,
            property.bedrooms,
            property.bathrooms,
            priceInWei
          )
          .send({
            from: accounts[0],
            gas: 5000000,
          });

        console.log("Listing transaction completed:", tx);

        // Update backend with transaction hash
        try {
          console.log("Updating backend with transaction hash...");
          console.log("Transaction hash:", tx.transactionHash);
          console.log("Property ID:", property._id);
          console.log("Auth token:", localStorage.getItem("token") ? "Present" : "Missing");
          
          // Ensure we have a valid token
          const token = localStorage.getItem("token");
          if (!token) {
            console.error("No authentication token found");
            throw new Error("Authentication token is missing");
          }
          
          const listResponse = await axios.put(
            `http://localhost:5001/api/properties/${property._id}/transaction`,
            {
              transactionHash: tx.transactionHash,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              },
            }
          );
          console.log(
            "Backend update response after listing:",
            listResponse.data
          );

          // 8. Immediately purchase the property
          console.log("Property listed successfully. Now purchasing...");
          const purchaseTx = await contract.methods
            .buyProperty(propertyId)
            .send({
              from: accounts[0],
              value: priceInWei,
              gas: 5000000,
            });

          console.log("Purchase transaction completed:", purchaseTx);

          // 9. Update backend to mark as sold
          try {
            console.log("Updating backend after purchase...");
            console.log("Property ID:", property._id);
            console.log("Buyer Address:", accounts[0]);
            console.log("User ID:", user._id);
            console.log("Seller ID:", property.seller?._id || property.seller);

            // First, update the property status
            const propertyResponse = await axios.put(
              `http://localhost:5001/api/properties/${property._id}/transaction`,
              {
                status: "sold",
                buyer: user._id,
                transactionHash: purchaseTx.transactionHash
              },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!propertyResponse.data) {
              throw new Error("No response data from property update");
            }

            console.log("Property update response:", propertyResponse.data);

            // Verify the response contains the updated buyer information
            if (!propertyResponse.data.buyer || propertyResponse.data.buyer.toString() !== user._id.toString()) {
              console.warn("Property update may not have set buyer ID correctly:", {
                expectedBuyer: user._id,
                actualBuyer: propertyResponse.data.buyer
              });
              
              // Try to update again with a more specific endpoint
              try {
                console.log("Attempting follow-up update to ensure buyer is set correctly");
                await axios.put(
                  `http://localhost:5001/api/properties/${property._id}`,
                  {
                    buyer: user._id,
                    status: "sold"
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                      "Content-Type": "application/json",
                    },
                  }
                );
              } catch (followUpErr) {
                console.error("Error in follow-up buyer update:", followUpErr);
              }
            }

            // Add transaction record
            try {
              const sellerId = property.seller?._id || property.seller;
              
              console.log("Creating transaction record with:");
              console.log("- Property ID:", property._id);
              console.log("- Buyer ID:", user._id);
              console.log("- Seller ID:", sellerId);
              console.log("- Amount:", property.price);
              console.log("- Transaction Hash:", purchaseTx.transactionHash);
              
              await axios.post(
                `http://localhost:5001/api/transactions`,
                {
                  propertyId: property._id,
                  amount: property.price,
                  status: "completed",
                  type: "purchase",
                  transactionHash: purchaseTx.transactionHash,
                  sellerId: sellerId
                },
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                  },
                }
              );
            } catch (transactionErr) {
              // Log but don't throw - property was still purchased even if transaction record fails
              console.error("Error creating transaction record:", transactionErr);
              console.error("Transaction API response:", transactionErr.response?.data);
              console.warn("Continuing with property purchase despite transaction record failure");
            }

            alert("Property successfully purchased! The property is now yours.");
            // Redirect to dashboard with a refresh parameter to ensure the page loads fresh data
            window.location.href = "/dashboard?refresh=" + new Date().getTime();
          } catch (err) {
            console.error("Error updating backend:", err);
            if (err.response) {
              console.error("Backend error details:", err.response.data);
              console.error("Backend status code:", err.response.status);
            }
            throw new Error(`Failed to update property status: ${err.message}`);
          }
        } catch (err) {
          console.error("Error updating backend after listing:", err);
          if (err.response) {
            console.error("Backend error details:", err.response.data);
            console.error("Backend error status:", err.response.status);
          }
          throw new Error(`Failed to update property status after listing: ${err.message}`);
        }
      } catch (err) {
        console.error("Error listing property on blockchain:", err);
        if (err.message.includes("insufficient funds")) {
          throw new Error("Insufficient funds for gas fees");
        } else if (err.message.includes("user denied")) {
          throw new Error("Transaction was rejected");
        } else {
          throw new Error(`Failed to list property: ${err.message}`);
        }
      }
    } catch (err) {
      console.error("Error:", err);
      if (err.message.includes("insufficient funds")) {
        setWeb3Error("Insufficient funds for gas fees and purchase");
      } else if (err.message.includes("user denied")) {
        setWeb3Error("Transaction was rejected");
      } else if (err.message.includes("Failed to update property status")) {
        setWeb3Error(
          "Property transaction completed but failed to update status. Please contact support."
        );
      } else {
        setWeb3Error(err.message || "Error processing transaction");
      }
    } finally {
      setProcessing(false);
    }
  };

  // Simplified purchase function
  const handlePurchase = async () => {
    console.log("Starting purchase process...");
    console.log("Current property state:", property);

    if (!property) {
      console.error("Property is undefined");
      setWeb3Error("Property details not loaded");
      return;
    }

    if (!property.blockchainId) {
      console.log(
        "Property not listed on blockchain. Listing and purchasing..."
      );
      await handleListOnBlockchain();
      return;
    }

    try {
      setProcessing(true);
      setWeb3Error("");

      // 1. Check MetaMask
      if (!window.ethereum) {
        setWeb3Error("Please install MetaMask to purchase properties");
        return;
      }

      // 2. Connect to MetaMask
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.requestAccounts();
      if (!accounts || accounts.length === 0) {
        setWeb3Error("Please connect your MetaMask wallet");
        return;
      }

      // 3. Get contract instance
      const networkId = await web3.eth.net.getId();
      console.log("Network ID:", networkId);

      const contractAddress = contractABI.networks[networkId]?.address;
      console.log("Contract address:", contractAddress);

      if (!contractAddress) {
        setWeb3Error("Contract not found on this network");
        return;
      }
      const contract = new web3.eth.Contract(contractABI.abi, contractAddress);

      // 4. Convert price to Wei
      const priceInWei = web3.utils.toWei(property.price.toString(), "ether");
      console.log("Price in Wei:", priceInWei);

      // 5. Make the purchase - ensure MetaMask confirmation is shown to the user
      console.log("Initiating purchase transaction...");
      console.log("Sending transaction with the following parameters:");
      console.log("From:", accounts[0]);
      console.log("Value:", priceInWei);
      console.log("PropertyId:", property.blockchainId);
      
      // Always send from accounts[0] to ensure MetaMask prompts the user
      const tx = await contract.methods
        .buyProperty(property.blockchainId)
        .send({
          from: accounts[0],
          value: priceInWei,
          gas: 5000000,
        });

      console.log("Purchase transaction completed:", tx);

      // 6. Update backend
      try {
        console.log("Updating backend after purchase...");
        console.log("Property ID:", property._id);
        console.log("Buyer Address:", accounts[0]);
        console.log("User ID:", user._id);
        console.log("Seller ID:", property.seller?._id || property.seller);

        // First, update the property status
        const response = await axios.put(
          `http://localhost:5001/api/properties/${property._id}/transaction`,
          {
            status: "sold",
            buyer: user._id,
            transactionHash: tx.transactionHash
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Backend update response:", response.data);

        // Verify the response contains the updated buyer information
        if (!response.data.buyer || response.data.buyer.toString() !== user._id.toString()) {
          console.warn("Property update may not have set buyer ID correctly:", {
            expectedBuyer: user._id,
            actualBuyer: response.data.buyer
          });
          
          // Try to update again with a more specific endpoint
          try {
            console.log("Attempting follow-up update to ensure buyer is set correctly");
            await axios.put(
              `http://localhost:5001/api/properties/${property._id}`,
              {
                buyer: user._id,
                status: "sold"
              },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                  "Content-Type": "application/json",
                },
              }
            );
          } catch (followUpErr) {
            console.error("Error in follow-up buyer update:", followUpErr);
          }
        }

        // Add transaction record
        try {
          const sellerId = property.seller?._id || property.seller;
          
          console.log("Creating transaction record with:");
          console.log("- Property ID:", property._id);
          console.log("- Buyer ID:", user._id);
          console.log("- Seller ID:", sellerId);
          console.log("- Amount:", property.price);
          console.log("- Transaction Hash:", tx.transactionHash);
          
          await axios.post(
            `http://localhost:5001/api/transactions`,
            {
              propertyId: property._id,
              amount: property.price,
              status: "completed",
              type: "purchase",
              transactionHash: tx.transactionHash,
              sellerId: sellerId
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          );
        } catch (transactionErr) {
          // Log but don't throw - property was still purchased even if transaction record fails
          console.error("Error creating transaction record:", transactionErr);
          console.error("Transaction API response:", transactionErr.response?.data);
          console.warn("Continuing with property purchase despite transaction record failure");
        }

        alert("Purchase successful! The property is now yours.");
        // Redirect to dashboard with a refresh parameter to ensure the page loads fresh data
        window.location.href = "/dashboard?refresh=" + new Date().getTime();
      } catch (err) {
        console.error("Error updating backend:", err);
        if (err.response) {
          console.error("Backend error details:", err.response.data);
        }
        throw new Error("Failed to update property status after purchase");
      }
    } catch (err) {
      console.error("Purchase error:", err);
      if (err.message.includes("insufficient funds")) {
        setWeb3Error("Insufficient funds in your wallet");
      } else if (err.message.includes("user denied")) {
        setWeb3Error("Transaction was rejected");
      } else if (err.message.includes("Property is already sold")) {
        setWeb3Error("Property has already been sold");
      } else if (err.message.includes("Failed to update property status")) {
        setWeb3Error(
          "Property transaction completed but failed to update status. Please contact support."
        );
      } else {
        setWeb3Error(err.message || "Error processing purchase");
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-100">
      <div className="flex flex-col lg:flex-row w-full min-h-[500px] lg:min-h-[600px] xl:min-h-[700px] bg-white">
        {/* Left: Property Details */}
        <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:py-0">
          {loading ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center">
                <p className="text-red-500 text-2xl">{error}</p>
              </div>
            </div>
          ) : !property ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center">
                <p className="text-red-500 text-2xl">Property not found</p>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
                {property.title || "Untitled Property"}
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                {property.description || "No description available"}
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <dt className="text-base font-medium text-gray-500">Price</dt>
                  <dd className="text-xl font-bold text-gray-900">
                    {property.price
                      ? `${property.price.toFixed(2)} ETH`
                      : "0.00 ETH"}
                  </dd>
                </div>
                <div>
                  <dt className="text-base font-medium text-gray-500">
                    Status
                  </dt>
                  <dd className="text-xl font-bold text-gray-900">
                    {property.status || "Unknown"}
                  </dd>
                </div>
                <div>
                  <dt className="text-base font-medium text-gray-500">
                    Location
                  </dt>
                  <dd className="text-lg text-gray-900">
                    {property.location || "Location not specified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-base font-medium text-gray-500">Size</dt>
                  <dd className="text-lg text-gray-900">
                    {property.size
                      ? `${property.size} sq ft`
                      : "Size not specified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-base font-medium text-gray-500">
                    Bedrooms
                  </dt>
                  <dd className="text-lg text-gray-900">
                    {property.bedrooms || "Not specified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-base font-medium text-gray-500">
                    Bathrooms
                  </dt>
                  <dd className="text-lg text-gray-900">
                    {property.bathrooms || "Not specified"}
                  </dd>
                </div>
              </dl>
              {/* Purchase Button */}
              {property.status === "available" ? (
                <div className="mt-4">
                  <button
                    onClick={handlePurchase}
                    disabled={processing}
                    className={`w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-medium text-white ${
                      processing
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-blue-500"
                    }`}
                  >
                    {processing ? "Processing..." : "Purchase Property"}
                  </button>
                  {web3Error && (
                    <p className="mt-4 text-lg text-red-600">{web3Error}</p>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-red-600 text-lg font-semibold">
                    This property is not available for purchase.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        {/* Right: Main Property Image */}
        <div className="flex-1 min-h-[300px] lg:min-h-0 flex flex-col items-center justify-center">
          {/* Image Gallery */}
          {property &&
          Array.isArray(property.images) &&
          property.images.length > 0 ? (
            <div className="w-full overflow-x-auto flex gap-4 pb-4">
              {property.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${property.title || "Property"} - Image ${idx + 1}`}
                  className="h-64 w-auto rounded-xl object-cover border border-gray-200"
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/800x600?text=Image+Not+Available";
                  }}
                />
              ))}
            </div>
          ) : (
            <img
              src="https://via.placeholder.com/800x600?text=No+Image"
              alt="No property"
              className="w-full h-64 object-cover rounded-xl"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PropertyDetails;
