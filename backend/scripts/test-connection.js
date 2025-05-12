const Web3 = require("web3");

async function testConnection() {
  try {
    const web3 = new Web3("http://127.0.0.1:7545");

    // Test connection
    const isListening = await web3.eth.net.isListening();
    console.log("Connected to Ganache:", isListening);

    // Get network ID
    const networkId = await web3.eth.net.getId();
    console.log("Network ID:", networkId);

    // Get accounts
    const accounts = await web3.eth.getAccounts();
    console.log("Available accounts:", accounts);

    // Get balance of first account
    const balance = await web3.eth.getBalance(accounts[0]);
    console.log(
      "Balance of first account:",
      web3.utils.fromWei(balance, "ether"),
      "ETH"
    );
  } catch (error) {
    console.error("Error connecting to Ganache:", error.message);
  }
}

testConnection();
