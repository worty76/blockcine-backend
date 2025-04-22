export const TicketContractAbi = [
  // Paste your contract ABI here from TicketContract.json
  // This should be an array of objects that define your contract's functions and events
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "ticketId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "filmId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "seatNumber",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "TicketMinted",
    type: "event",
  },
  // Add the rest of your ABI here...
];
