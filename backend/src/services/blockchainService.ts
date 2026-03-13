import { ethers } from 'ethers';

const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology/';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const normalizedPrivateKey = PRIVATE_KEY
  ? (PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`)
  : undefined;

// Minimal ABI for releasing funds (assuming standard ERC20 or custom mechanism)
// V1 mock uses a generic function signature
const abi = [
  "function createProject(string name, uint256 budget, address contractor) public returns (uint256)",
  "function releaseFunds(uint256 projectId, uint256 amount) public",
  "function addProof(uint256 projectId, string ipfsHash) public",
  "function projectCounter() public view returns (uint256)"
];

const getContract = () => {
  const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
  const wallet = new ethers.Wallet(normalizedPrivateKey!, provider);
  return new ethers.Contract(CONTRACT_ADDRESS!, abi, wallet);
};

export const blockchainService = {
  /**
   * Creates project on-chain and returns transaction hash.
   */
  createProjectOnChain: async (
    name: string,
    budgetPaise: number
  ): Promise<{ txHash: string; onChainProjectId: number }> => {
    if (!normalizedPrivateKey || !CONTRACT_ADDRESS) {
      console.warn('⚠️ Blockchain configuration missing. Using mock project creation transaction.');
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return {
        txHash: `0xmockcreate${Date.now().toString(16).padStart(54, '0')}`,
        onChainProjectId: 0,
      };
    }

    try {
      const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
      const wallet = new ethers.Wallet(normalizedPrivateKey!, provider);
      const contract = new ethers.Contract(CONTRACT_ADDRESS!, abi, wallet);
      // V1: contractor wallet identity is not stored yet, so signer address is used.
      const contractor = wallet.address || ethers.ZeroAddress;
      const tx = await contract.createProject(name, budgetPaise, contractor);
      const receipt = await tx.wait(1);
      if (!receipt || Number(receipt.status) !== 1) {
        throw new Error('Project creation transaction failed');
      }

      let onChainProjectId = 0;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === 'ProjectCreated') {
            onChainProjectId = Number(parsed.args.projectId);
            break;
          }
        } catch {
          // Ignore non-contract logs
        }
      }

      if (!onChainProjectId) {
        // Compatibility fallback: some deployments may not emit a parseable ProjectCreated log.
        // In that case read the latest counter value from chain.
        const counter = await contract.projectCounter();
        onChainProjectId = Number(counter);
      }

      return { txHash: tx.hash, onChainProjectId };
    } catch (error) {
      console.error('Blockchain project creation failed:', error);
      const msg = error instanceof Error ? error.message : 'Unknown blockchain error';
      throw new Error(`Failed to create project on blockchain: ${msg}`);
    }
  },

  /**
   * Executes a transaction on the Polygon blockchain to record the fund release.
   * Returns the transaction hash.
   */
  executeFundRelease: async (projectId: number, amountPaise: number): Promise<string> => {
    if (!normalizedPrivateKey || !CONTRACT_ADDRESS) {
      console.warn('⚠️ Blockchain configuration missing. Using mock transaction.');
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      return `0xmocktxhash${Date.now().toString(16).padStart(48, '0')}`;
    }

    try {
      const contract = getContract();

      const tx = await contract.releaseFunds(projectId, amountPaise);
      
      // In a real app we might await tx.wait() for 1 block confirmation,
      // but to keep the HTTP response fast, we return the hash immediately.
      return tx.hash;
    } catch (error) {
      console.error('Blockchain transaction failed:', error);
      const msg = error instanceof Error ? error.message : 'Unknown blockchain error';
      throw new Error(`Failed to execute smart contract transaction: ${msg}`);
    }
  },

  /**
   * Records proof CID on-chain for immutable audit.
   */
  recordProofHash: async (projectId: number, ipfsHash: string): Promise<string> => {
    if (!normalizedPrivateKey || !CONTRACT_ADDRESS) {
      console.warn('⚠️ Blockchain configuration missing. Using mock proof transaction.');
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return `0xmockprooftx${Date.now().toString(16).padStart(46, '0')}`;
    }

    try {
      const contract = getContract();
      const tx = await contract.addProof(projectId, ipfsHash);
      return tx.hash;
    } catch (error) {
      console.error('Proof blockchain transaction failed:', error);
      const msg = error instanceof Error ? error.message : 'Unknown blockchain error';
      throw new Error(`Failed to record proof hash on blockchain: ${msg}`);
    }
  }
};
