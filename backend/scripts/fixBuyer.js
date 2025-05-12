const mongoose = require('mongoose');
const Property = require('../models/Property');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Function to fix buyer assignment for properties
async function fixBuyerAssignment() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get command line arguments
    const args = process.argv.slice(2);
    const userId = args[0];
    const propertyId = args[1];

    if (!userId || !propertyId) {
      console.error('Usage: node fixBuyer.js <userId> <propertyId>');
      process.exit(1);
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User with ID ${userId} not found`);
      process.exit(1);
    }
    console.log(`Found user: ${user.name} (${user._id})`);

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      console.error(`Property with ID ${propertyId} not found`);
      process.exit(1);
    }
    console.log(`Found property: ${property.title} (${property._id})`);
    console.log(`Current status: ${property.status}, Current buyer: ${property.buyer || 'None'}`);

    // Update property
    const updatedProperty = await Property.findByIdAndUpdate(
      propertyId,
      { 
        buyer: userId,
        status: 'sold' 
      },
      { new: true }
    );

    console.log('Property updated successfully:');
    console.log(`- Title: ${updatedProperty.title}`);
    console.log(`- Status: ${updatedProperty.status}`);
    console.log(`- Buyer: ${updatedProperty.buyer}`);

    // Disconnect from database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    console.log('Done! Property has been updated. Please refresh your dashboard.');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the function
fixBuyerAssignment(); 