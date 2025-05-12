const Web3 = require("web3");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function login() {
  try {
    const response = await axios.post("http://localhost:5000/api/users/login", {
      email: "seller@example.com",
      password: "password123",
    });

    return {
      token: response.data.token,
      userId: response.data.user._id,
    };
  } catch (error) {
    console.error("Login failed:", error.response?.data || error.message);
    throw error;
  }
}

async function listProperty() {
  try {
    // Login to get token and seller ID
    console.log("Logging in...");
    const { token, userId } = await login();
    console.log("Login successful. User ID:", userId);

    // Read contract ABI
    const contractPath = path.join(
      __dirname,
      "../build/contracts/PropertyContract.json"
    );
    const contractData = JSON.parse(fs.readFileSync(contractPath, "utf8"));

    // Connect to Ganache
    const web3 = new Web3("http://localhost:7545");

    // Get accounts
    const accounts = await web3.eth.getAccounts();
    const sellerAccount = accounts[0];

    // Get network ID
    const networkId = await web3.eth.net.getId();
    console.log("Connected to network:", networkId);

    if (!contractData.networks[networkId]) {
      throw new Error("Contract not deployed to detected network");
    }

    // Get contract instance
    const contract = new web3.eth.Contract(
      contractData.abi,
      contractData.networks[networkId].address
    );

    // Property details for blockchain
    const title = "Luxury Penthouse with City View";
    const description =
      "Stunning penthouse apartment with panoramic city views. Features include floor-to-ceiling windows, modern kitchen, and private terrace.";
    const location = "Mumbai";
    const size = web3.utils.toBN("2500"); // Convert string to BN
    const bedrooms = web3.utils.toBN("3"); // Convert string to BN
    const bathrooms = web3.utils.toBN("2"); // Convert string to BN
    const price = web3.utils.toWei("20", "ether"); // Convert to Wei

    // Log the values we're sending
    console.log("Sending to blockchain:", {
      title,
      description,
      location,
      size: size.toString(),
      bedrooms: bedrooms.toString(),
      bathrooms: bathrooms.toString(),
      price: web3.utils.fromWei(price, "ether") + " ETH",
    });

    // List property on blockchain
    console.log("Listing property on blockchain...");
    const tx = await contract.methods
      .listProperty(
        title,
        description,
        location,
        size,
        bedrooms,
        bathrooms,
        price
      )
      .send({ from: sellerAccount, gas: 3000000 });

    console.log("Property listed on blockchain:", tx.transactionHash);

    // Property details for backend
    const backendPropertyDetails = {
      title,
      description,
      location,
      size: 2500,
      bedrooms: 3,
      bathrooms: 2,
      price: "20", // Price in ETH for backend
      contractAddress: contractData.networks[networkId].address,
      seller: userId,
      status: "available",
      images: [
        "https://example.com/property1.jpg",
        "https://example.com/property2.jpg",
      ],
    };

    // List property in backend
    console.log("Listing property in backend...");
    const backendResponse = await axios.post(
      "http://localhost:5000/api/properties",
      backendPropertyDetails,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Property listed in backend:", backendResponse.data);
    console.log("Property listed successfully!");
  } catch (error) {
    if (error.response) {
      console.error("Server error:", error.response.data);
      console.error("Status code:", error.response.status);
    } else if (error.request) {
      console.error("No response received from server");
    } else {
      console.error("Error:", error.message);
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
    }
  }
}

listProperty();
