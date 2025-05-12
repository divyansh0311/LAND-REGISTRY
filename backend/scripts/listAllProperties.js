const mongoose = require('mongoose');
const Property = require('../models/Property');
const User = require('../models/User');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Function to list all properties
async function listAllProperties() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get all properties
    const properties = await Property.find()
      .populate('seller', 'name email walletAddress')
      .populate('buyer', 'name email walletAddress');

    console.log('====== ALL PROPERTIES ======');
    console.log(`Found ${properties.length} properties`);

    // Display each property
    for (const property of properties) {
      console.log('\n-------------------------------');
      console.log(`ID: ${property._id}`);
      console.log(`Title: ${property.title}`);
      console.log(`Status: ${property.status}`);
      console.log(`Price: ${property.price} ETH`);
      console.log(`Seller: ${property.seller.name} (${property.seller._id})`);
      console.log(`Buyer: ${property.buyer ? `${property.buyer.name} (${property.buyer._id})` : 'None'}`);
    }

    // Get all users for reference
    const users = await User.find();

    console.log('\n\n====== ALL USERS ======');
    console.log(`Found ${users.length} users`);

    // Display each user
    for (const user of users) {
      console.log('\n-------------------------------');
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
    }

    // Disconnect from database
    await mongoose.disconnect();
    console.log('\n\nDisconnected from MongoDB');
    console.log('Done! Use the IDs above with the fixBuyer.js script to assign properties to the correct user.');
    console.log('Example: node scripts/fixBuyer.js <USER_ID> <PROPERTY_ID>');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the function
listAllProperties(); 