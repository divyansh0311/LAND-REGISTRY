const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const auth = require("../middleware/auth");

// Get all properties
router.get("/", async (req, res) => {
  try {
    const query = {};
    
    // If user param is provided, filter by seller or buyer
    if (req.query.user) {
      query.$or = [
        { seller: req.query.user },
        { buyer: req.query.user }
      ];
    }
    
    console.log("Property query:", query);
    
    const properties = await Property.find(query)
      .populate("seller", "name email walletAddress")
      .populate("buyer", "name email walletAddress");
      
    console.log(`Found ${properties.length} properties`);
    res.json(properties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single property
router.get("/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("seller", "name email walletAddress")
      .populate("buyer", "name email walletAddress");
      
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json(property);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new property (seller only)
router.post("/", auth, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      location,
      size,
      bedrooms,
      bathrooms,
      images,
      contractAddress,
    } = req.body;

    // Check if user is a seller
    if (req.user.role !== "seller") {
      return res
        .status(403)
        .json({ message: "Only sellers can list properties" });
    }

    const property = new Property({
      title,
      description,
      price,
      location,
      size,
      bedrooms,
      bathrooms,
      images,
      seller: req.user.id,
      contractAddress,
    });

    await property.save();
    res.status(201).json(property);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update property (seller only)
router.put("/:id", auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if this is a purchase operation (status change to "sold")
    const isPurchaseOperation = req.body.status === "sold" && req.body.buyer;
    
    // Check if this is a pre-listing operation (updating blockchainId)
    const isPreListingOperation = req.body.blockchainId !== undefined;
    
    // Check if this is a transaction hash update
    const isTransactionUpdate = req.body.transactionHash !== undefined;
    
    // Check authorization: seller can update their property, 
    // buyer can update when purchasing,
    // anyone can update for pre-listing operation or transaction hash update
    if (!isPurchaseOperation && !isPreListingOperation && !isTransactionUpdate && 
        property.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedProperty);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Special route for blockchain transactions (listing, buying)
router.put("/:id/transaction", auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // This route is specifically for blockchain transactions
    // Log all the updates being applied
    console.log(`Transaction update for property ${req.params.id}:`, req.body);
    
    // If this is a purchase with a buyer ID, ensure it's properly set
    if (req.body.status === "sold" && req.body.buyer) {
      console.log(`Setting buyer to ${req.body.buyer} for property ${req.params.id}`);
    }
    
    // Ensure the update object contains all fields we want to update
    const updateData = { ...req.body };
    
    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("seller", "name email walletAddress")
     .populate("buyer", "name email walletAddress");
    
    console.log(`Updated property ${req.params.id}:`, {
      status: updatedProperty.status,
      buyer: updatedProperty.buyer,
      seller: updatedProperty.seller
    });
    
    res.json(updatedProperty);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete property (seller only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Check if user is the seller
    if (property.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await property.remove();
    res.json({ message: "Property removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
