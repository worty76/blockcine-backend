import { ethers } from "ethers";
import dotenv from "dotenv";
import { TicketContractAbi } from "../config/contractAbi";

dotenv.config();

class EthereumService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private wallet: ethers.Wallet;

  constructor() {
    try {
      // Connect to Ethereum network
      this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);

      // Create wallet from private key - add error handling and proper private key formatting
      const privateKey = process.env.ETHEREUM_PRIVATE_KEY as string;

      // Check if the private key starts with '0x', if not, add it
      const formattedPrivateKey = privateKey.startsWith("0x")
        ? privateKey
        : `0x${privateKey}`;

      // Create the wallet with proper error handling
      try {
        this.wallet = new ethers.Wallet(formattedPrivateKey, this.provider);
      } catch (error) {
        console.error("Error creating wallet:", error);
        // Try alternative format without 0x prefix
        if (privateKey.startsWith("0x")) {
          this.wallet = new ethers.Wallet(
            privateKey.substring(2),
            this.provider
          );
        } else {
          throw error;
        }
      }

      // Connect to contract
      this.contract = new ethers.Contract(
        process.env.CONTRACT_ADDRESS as string,
        TicketContractAbi,
        this.wallet
      );
    } catch (error) {
      console.error("Error initializing EthereumService:", error);
      throw error;
    }
  }

  async mintTicket(
    userId: string,
    filmId: string,
    seatNumber: number,
    price: number
  ): Promise<string> {
    try {
      // Create metadata for the ticket
      const metadata = {
        userId,
        filmId,
        seatNumber,
        price,
        timestamp: Date.now(),
      };

      // In production, you would upload this to IPFS and use the URI
      const metadataURI = `data:application/json;base64,${Buffer.from(
        JSON.stringify(metadata)
      ).toString("base64")}`;

      // Mint the ticket on blockchain
      const tx = await this.contract.mintTicket(
        filmId,
        seatNumber,
        metadataURI
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Get ticket ID from events - fix syntax error and add type
      const event = receipt.events?.find(
        (e: { event: string }) => e.event === "TicketMinted"
      );
      const ticketId = event?.args?.ticketId.toString();

      return ticketId;
    } catch (error) {
      console.error("Error minting ticket:", error);
      throw error;
    }
  }

  async transferTicket(
    ticketId: string,
    fromAddress: string,
    toAddress: string
  ): Promise<boolean> {
    try {
      const tx = await this.contract.transferTicket(ticketId, toAddress);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error transferring ticket:", error);
      throw error;
    }
  }

  async refundTicket(ticketId: string): Promise<boolean> {
    try {
      const tx = await this.contract.refundTicket(ticketId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error refunding ticket:", error);
      throw error;
    }
  }

  async verifyTicket(ticketId: string): Promise<boolean> {
    try {
      return await this.contract.verifyTicket(ticketId);
    } catch (error) {
      console.error("Error verifying ticket:", error);
      throw error;
    }
  }

  async getTicketDetails(ticketId: string): Promise<any> {
    try {
      return await this.contract.getTicketDetails(ticketId);
    } catch (error) {
      console.error("Error getting ticket details:", error);
      throw error;
    }
  }

  async verifyReservation(
    filmId: string,
    userId: string,
    seatNumber: number
  ): Promise<boolean> {
    try {
      console.log(
        `Ethereum verifying - Film: ${filmId}, User: ${userId}, Seat: ${seatNumber}`
      );

      try {
        // First try to get the ticket ID by film and seat
        const ticketId = await this.contract.getTicketByFilmAndSeat(
          filmId,
          seatNumber
        );
        console.log(`Found ticket ID: ${ticketId.toString()}`);

        if (ticketId && !ticketId.isZero()) {
          // Check if the ticket is valid
          const isValid = await this.contract.isTicketValid(ticketId);
          console.log(`Ticket validity: ${isValid}`);
          return isValid;
        } else {
          console.log("No ticket found for this film and seat");
          return false;
        }
      } catch (error) {
        console.error("Error getting ticket by film and seat:", error);

        // Try the direct verification method
        return await this.contract.verifyTicket(filmId, userId, seatNumber);
      }
    } catch (error) {
      console.error("Error verifying reservation:", error);
      return false;
    }
  }
}

export default new EthereumService();
