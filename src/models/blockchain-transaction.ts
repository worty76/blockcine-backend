import mongoose from "mongoose";

const blockchainTransactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    required: true,
  },
  blockchainHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const BlockchainTransaction = mongoose.model(
  "BlockchainTransaction",
  blockchainTransactionSchema
);
