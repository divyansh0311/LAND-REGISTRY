# PropertyChain Frontend

This is the frontend application for PropertyChain, a decentralized property marketplace using blockchain technology.

## Features

- User authentication (Login/Register)
- Property listing and browsing
- Property details with image gallery
- Secure blockchain-based transactions
- User dashboard for managing properties and transactions
- MetaMask integration for Ethereum transactions

## Tech Stack

- React.js
- Tailwind CSS
- Web3.js
- Axios for API communication
- React Router for navigation

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory with:

```
VITE_API_URL=http://localhost:5000
```

3. Make sure you have MetaMask installed in your browser and connected to your local Ganache network.

4. Start the development server:

```bash
npm run dev
```

## Development

The project structure is organized as follows:

```
src/
  ├── components/     # Reusable UI components
  ├── context/       # React context for state management
  ├── pages/         # Page components
  ├── utils/         # Utility functions
  └── App.jsx        # Main application component
```

### Key Components

- `Navbar.jsx` - Navigation and authentication status
- `PrivateRoute.jsx` - Route protection for authenticated users
- `PropertyCard.jsx` - Reusable property display component

### Pages

- `Home.jsx` - Landing page with featured properties
- `Properties.jsx` - Property listing page
- `PropertyDetails.jsx` - Individual property view
- `Login.jsx` - User login
- `Register.jsx` - User registration
- `Dashboard.jsx` - User dashboard

## Styling

The application uses Tailwind CSS for styling. The configuration can be found in:

- `tailwind.config.js`
- `src/index.css`

## Web3 Integration

Web3 functionality is integrated through:

- MetaMask for wallet connection
- Web3.js for blockchain interaction
- Smart contract integration for property transactions

## Building for Production

To create a production build:

```bash
npm run build
```

The build will be available in the `dist` directory.

## Testing

To run tests:

```bash
npm test
```
