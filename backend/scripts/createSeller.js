const axios = require("axios");

async function createSeller() {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/users/register",
      {
        name: "Test Seller",
        email: "seller@example.com",
        password: "password123",
        role: "seller",
      }
    );

    console.log("Seller account created successfully:", response.data);

    // Now login to verify
    const loginResponse = await axios.post(
      "http://localhost:5000/api/users/login",
      {
        email: "seller@example.com",
        password: "password123",
      }
    );

    console.log("Login successful!");
    console.log("User ID:", loginResponse.data.user._id);
    console.log("Token:", loginResponse.data.token);
  } catch (error) {
    if (error.response) {
      console.error("Server error:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

createSeller();
