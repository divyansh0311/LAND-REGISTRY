# Property Marketplace

A decentralized property marketplace where users can list properties for sale and purchase properties using blockchain technology.

## Features

- User authentication (Signup/Login)
- Property listing and management
- Property search and filtering
- Secure blockchain-based transactions
- MetaMask integration for payments
- MongoDB Atlas database for property and user data

## Tech Stack

- Frontend: React.js, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB Atlas
- Blockchain: Ganache, MetaMask, Solidity
- Smart Contract: Ethereum-based property transactions

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Ganache (for local blockchain)
- MetaMask browser extension
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables:

   Create `.env` files in both frontend and backend directories:

   Backend `.env`:
   ```
   MONGODB_URI=your_mongodb_atlas_uri_here
   PORT=5001
   JWT_SECRET=your_jwt_secret_here
   GANACHE_URL=http://127.0.0.1:7545
   FRONTEND_URL=http://localhost:5173
   ```

   Frontend `.env`:
   ```
   VITE_API_URL=http://localhost:5001
   VITE_BLOCKCHAIN_NETWORK=http://127.0.0.1:7545
   ```

4. MongoDB Atlas Setup:
   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster
   - Get your connection string from Atlas
   - Replace `your_mongodb_atlas_uri_here` in backend `.env` with your Atlas URI
   - Whitelist your IP address in Atlas Network Access

5. Start the development servers:

   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server (in a new terminal)
   cd ../frontend
   npm start
   ```

6. Blockchain Setup:
   - Start Ganache and create a new workspace
   - Import a Ganache account into MetaMask:
     - Copy private key from Ganache
     - Import account in MetaMask using the private key
     - Add Ganache network to MetaMask (typically http://127.0.0.1:7545)

## Smart Contract

The project includes a Solidity smart contract for handling property transactions:

- Property listing
- Purchase requests
- Payment processing
- Ownership transfer

## Security

- All sensitive data is encrypted
- Blockchain transactions are secure and transparent
- User authentication is implemented with JWT
- MetaMask integration ensures secure payments
- Environment variables for sensitive configuration

## Troubleshooting

Common issues and solutions:
- If MongoDB connection fails, check if:
  - Your IP is whitelisted in Atlas
  - Connection string is correct in .env
  - Network access is not blocked by firewall
- If blockchain transactions fail:
  - Ensure Ganache is running
  - MetaMask is connected to correct network
  - You have sufficient test ETH in your account

## License

MIT
