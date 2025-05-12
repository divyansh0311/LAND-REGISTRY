const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");

// Get all transactions for a user
router.get("/", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ buyer: req.user.id }, { seller: req.user.id }],
    })
      .populate("property", "title price")
      .populate("buyer", "name")
      .populate("seller", "name")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new transaction
router.post("/", auth, async (req, res) => {
  try {
    const { propertyId, amount, status, type, transactionHash, sellerId } = req.body;
    
    console.log("Creating transaction with data:", req.body);
    
    // Validate required fields
    if (!propertyId || !amount || !type || !sellerId) {
      return res.status(400).json({ 
        message: "Missing required fields",
        required: ["propertyId", "amount", "type", "sellerId"],
        received: Object.keys(req.body)
      });
    }

    const transaction = new Transaction({
      property: propertyId,
      buyer: req.user.id,
      seller: sellerId,
      amount,
      status: status || "completed",
      type,
      transactionHash
    });

    const savedTransaction = await transaction.save();
    console.log("Transaction created successfully:", savedTransaction);
    res.status(201).json(savedTransaction);
  } catch (err) {
    console.error("Transaction creation error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get single transaction
router.get("/:id", auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("property", "title price")
      .populate("buyer", "name")
      .populate("seller", "name");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Check if user is authorized to view this transaction
    if (
      transaction.buyer.toString() !== req.user.id &&
      transaction.seller.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
