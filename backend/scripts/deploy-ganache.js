const Web3 = require("web3");
const path = require("path");
const fs = require("fs");

async function deployContract() {
  try {
    // Connect to Ganache
    const web3 = new Web3("http://127.0.0.1:7545");

    // Get accounts
    const accounts = await web3.eth.getAccounts();
    const deployerAccount = accounts[0];

    // Get network ID - should be 1337 for Ganache
    const networkId = await web3.eth.net.getId();
    console.log("Connected to network with ID:", networkId);
    console.log("Deploying from account:", deployerAccount);

    // Read contract data
    const contractPath = path.join(
      __dirname,
      "../build/contracts/PropertyContract.json"
    );
    const contractData = JSON.parse(fs.readFileSync(contractPath, "utf8"));

    // Deploy contract
    console.log("Deploying contract...");
    const Contract = new web3.eth.Contract(contractData.abi);
    const gas = await Contract.deploy({
      data: contractData.bytecode,
    }).estimateGas();
    console.log("Estimated gas:", gas);

    const contract = await Contract.deploy({
      data: contractData.bytecode,
    }).send({
      from: deployerAccount,
      gas: gas,
    });

    console.log("Contract deployed at address:", contract.options.address);

    // Update contract data with network information
    contractData.networks = {
      ...contractData.networks,
      [networkId]: {
        address: contract.options.address,
        transactionHash: contract.transactionHash,
      },
    };

    // Save updated contract data
    fs.writeFileSync(contractPath, JSON.stringify(contractData, null, 2));
    console.log("Contract data updated with network information");

    // Update frontend contract configuration
    const frontendContractPath = path.join(
      __dirname,
      "../../frontend/src/contracts/PropertyContract.json"
    );
    fs.writeFileSync(
      frontendContractPath,
      JSON.stringify(contractData, null, 2)
    );
    console.log("Frontend contract configuration updated");
  } catch (error) {
    console.error("Error deploying contract:", error);
  }
}

deployContract(); 