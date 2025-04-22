import { Block, IBlock } from "../models/blockchain";

class BlockchainService {
  private difficulty: number = 2; // Difficulty for proof of work

  // Add a new transaction to the blockchain
  async addTransaction(transaction: {
    userId: string;
    filmId: string;
    seatNumber: number;
    price: number;
    transactionType: "PURCHASE" | "REFUND" | "TRANSFER";
  }): Promise<IBlock> {
    try {
      // Get the latest block
      let latestBlock = await this.getLatestBlock();

      let newBlock;

      if (!latestBlock) {
        // Create genesis block if blockchain is empty
        newBlock = new Block({
          index: 0,
          timestamp: Date.now(),
          transactions: [{ ...transaction, timestamp: Date.now() }],
          previousHash: "0",
          hash: "",
          nonce: 0,
        });
      } else {
        // Create new block referencing previous block
        newBlock = new Block({
          index: latestBlock.index + 1,
          timestamp: Date.now(),
          transactions: [{ ...transaction, timestamp: Date.now() }],
          previousHash: latestBlock.hash,
          hash: "",
          nonce: 0,
        });
      }

      // Calculate initial hash and mine the block
      newBlock.hash = newBlock.calculateHash();
      newBlock.mineBlock(this.difficulty);

      // Save the block to database
      await newBlock.save();

      return newBlock;
    } catch (error) {
      console.error("Error adding transaction to blockchain:", error);
      throw error;
    }
  }

  // Verify the integrity of the blockchain
  async verifyBlockchain(): Promise<boolean> {
    const blocks = await Block.find().sort({ index: 1 });

    // If there are less than 2 blocks, the chain is valid
    if (blocks.length < 2) return true;

    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];

      // Create instances to access methods
      const currentBlockInstance = new Block(currentBlock);

      // Check if hash is valid
      if (currentBlock.hash !== currentBlockInstance.calculateHash()) {
        return false;
      }

      // Check if previous hash reference is correct
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }

  // Get the latest block in the chain
  async getLatestBlock(): Promise<IBlock | null> {
    return await Block.findOne().sort({ index: -1 });
  }

  // Get all blocks in the chain
  async getAllBlocks(): Promise<IBlock[]> {
    return await Block.find().sort({ index: 1 });
  }

  // Verify a specific transaction
  async verifyTransaction(
    filmId: string,
    userId: string,
    seatNumber: number
  ): Promise<{
    verified: boolean;
    transactionDetails?: any;
    blockIndex?: number;
  }> {
    try {
      const blocks = await Block.find().sort({ index: 1 });

      for (const block of blocks) {
        const transaction = block.transactions.find(
          (tx) =>
            tx.filmId === filmId &&
            tx.userId === userId &&
            tx.seatNumber === seatNumber
        );

        if (transaction) {
          return {
            verified: true,
            transactionDetails: transaction,
            blockIndex: block.index,
          };
        }
      }

      return { verified: false };
    } catch (error) {
      console.error("Error verifying transaction:", error);
      throw error;
    }
  }
}

export default new BlockchainService();
