# PropertyChain Backend

This is the backend server for the PropertyChain application, a decentralized property marketplace using blockchain technology.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/property-marketplace
JWT_SECRET=your-secret-key
GANACHE_URL=http://127.0.0.1:7545
```

3. Make sure MongoDB is running locally or update the MONGODB_URI with your MongoDB connection string.

4. Make sure Ganache is running locally on port 7545 or update the GANACHE_URL with your Ganache instance URL.

5. Start the development server:

```bash
npm run dev
```

## API Endpoints

### Authentication

- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user

### Properties

- GET /api/properties - Get all properties
- GET /api/properties/:id - Get single property
- POST /api/properties - Create new property (requires authentication)
- PUT /api/properties/:id - Update property (requires authentication)
- DELETE /api/properties/:id - Delete property (requires authentication)

### Transactions

- GET /api/transactions - Get user transactions
- POST /api/transactions - Create new transaction

## Smart Contract

The smart contract for property transactions is located in the `contracts` directory. To deploy the contract:

1. Make sure Ganache is running
2. Deploy the contract using Truffle:

```bash
truffle migrate --network development
```

## Security

- All routes requiring authentication are protected with JWT
- Passwords are hashed using bcrypt
- Environment variables are used for sensitive data
- CORS is enabled for the frontend application

## Error Handling

The API includes comprehensive error handling for:

- Invalid requests
- Authentication errors
- Database errors
- Smart contract interaction errors

## Development

To run the server in development mode with hot reloading:

```bash
npm run dev
```

For production:

```bash
npm start
```
