import axios from 'axios';
import FormData from 'form-data';

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

export const ipfsService = {
  /**
   * Pins a file buffer to IPFS via Pinata.
   * Returns the IPFS hash (CID).
   */
  uploadToIPFS: async (fileBuffer: Buffer, fileName: string): Promise<string> => {
    if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) {
      console.warn('⚠️ Pinata API keys missing. Using mock IPFS upload.');
      return `mock-ipfs-hash-${Date.now()}`;
    }

    const formData = new FormData();
    formData.append('file', fileBuffer, { filename: fileName });

    try {
      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
        maxBodyLength: Infinity // For larger files
      });

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error uploading to Pinata IPFS:', error);
      throw new Error('Failed to pin file to IPFS');
    }
  }
};
