import * as crypto from "crypto";
import mongoose, { Schema, Document } from "mongoose";

// Define the interface for transaction
interface ITransaction {
  userId: string;
  filmId: string;
  seatNumber: number;
  price: number;
  transactionType: "PURCHASE" | "REFUND" | "TRANSFER";
  timestamp: number;
}

// Define the structure of a block in our blockchain with methods
export interface IBlock extends Document {
  index: number;
  timestamp: number;
  transactions: ITransaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  calculateHash(): string;
  mineBlock(difficulty: number): void;
}

// Schema for a block
const BlockSchema = new Schema<IBlock>({
  index: { type: Number, required: true },
  timestamp: { type: Number, required: true },
  transactions: [
    {
      userId: { type: String, required: true },
      filmId: { type: String, required: true },
      seatNumber: { type: Number, required: true },
      price: { type: Number, required: true },
      transactionType: {
        type: String,
        enum: ["PURCHASE", "REFUND", "TRANSFER"],
        required: true,
      },
      timestamp: { type: Number, required: true },
    },
  ],
  previousHash: { type: String, required: true },
  hash: { type: String, required: true },
  nonce: { type: Number, required: true },
});

// Calculate hash for a block
BlockSchema.methods.calculateHash = function (): string {
  return crypto
    .createHash("sha256")
    .update(
      this.index +
        this.timestamp +
        JSON.stringify(this.transactions) +
        this.previousHash +
        this.nonce
    )
    .digest("hex");
};

// Mine a block (proof of work)
BlockSchema.methods.mineBlock = function (difficulty: number): void {
  const target = Array(difficulty + 1).join("0");

  while (this.hash.substring(0, difficulty) !== target) {
    this.nonce++;
    this.hash = this.calculateHash();
  }
};

// Create the model
export const Block = mongoose.model<IBlock>("Block", BlockSchema);
