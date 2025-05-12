const path = require("path");
const fs = require("fs");
const solc = require("solc");

function compile() {
  try {
    // Read the contract
    const contractPath = path.resolve(
      __dirname,
      "../contracts/PropertyContract.sol"
    );
    const source = fs.readFileSync(contractPath, "utf8");

    // Prepare input for compiler
    const input = {
      language: "Solidity",
      sources: {
        "PropertyContract.sol": {
          content: source,
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["abi", "evm.bytecode", "evm.deployedBytecode"],
          },
        },
        optimizer: {
          enabled: true,
          runs: 200,
        },
        evmVersion: "london",
      },
    };

    // Compile the contract
    console.log("Compiling contract...");
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Check for errors
    if (output.errors) {
      output.errors.forEach((error) => {
        console.log(error.formattedMessage);
      });

      const hasError = output.errors.some(
        (error) => error.severity === "error"
      );
      if (hasError) {
        throw new Error("Compilation failed due to errors");
      }
    }

    // Get contract details
    const contract =
      output.contracts["PropertyContract.sol"]["PropertyContract"];

    if (!contract || !contract.evm || !contract.evm.bytecode) {
      console.log("Compilation output:", JSON.stringify(output, null, 2));
      throw new Error("Invalid compilation output - missing bytecode");
    }

    // Create build directory if it doesn't exist
    const buildPath = path.resolve(__dirname, "../build/contracts");
    if (!fs.existsSync(buildPath)) {
      fs.mkdirSync(buildPath, { recursive: true });
    }

    // Write output to file
    const artifact = {
      contractName: "PropertyContract",
      abi: contract.abi,
      bytecode: "0x" + contract.evm.bytecode.object,
      deployedBytecode: "0x" + contract.evm.deployedBytecode.object,
    };

    fs.writeFileSync(
      path.resolve(buildPath, "PropertyContract.json"),
      JSON.stringify(artifact, null, 2)
    );

    console.log("Contract compiled successfully!");
    console.log("Bytecode size:", artifact.bytecode.length, "bytes");
  } catch (error) {
    console.error("Compilation failed:", error.message);
    process.exit(1);
  }
}

compile();
