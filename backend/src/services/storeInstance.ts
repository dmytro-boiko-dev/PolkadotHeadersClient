import {MerkleTreeStore, MerkleTree} from './merkleTreeStore';

// single store to be used in the merkle trees logic and in the routes
const merkleTreeStore = new MerkleTreeStore();

export {merkleTreeStore, MerkleTree};
