import {Router, Request, Response} from 'express';
import {merkleTreeStore} from '../services/storeInstance';
import {hashData, verifyMerkleProof, MerkleProofStep} from '../services/merkleTreeStore';

const router = Router();

router.get('/block/:number', (req: Request, res: Response) => {
    const blockNumber: string = req.params.number;
    const header = merkleTreeStore.getHeaderByBlockNumber(blockNumber);
    if (header) {
        res.json(header);
    } else {
        res.status(404).json({error: `Header not found for block number ${blockNumber}`});
    }
});

router.get('/hash/:hash', (req: Request, res: Response) => {
    const hash = req.params.hash;
    const header = merkleTreeStore.getHeaderByHash(hash);
    if (header) {
        res.json(header);
    } else {
        res.status(404).json({error: `Header not found for hash ${hash}`});
    }
});

router.get('/proof/:hash', (req: Request, res: Response) => {
    const hash = req.params.hash;
    const header = merkleTreeStore.getHeaderByHash(hash);

    if (!header) {
        return res.status(404).json({error: `Header not found for hash ${hash}`});
    }

    const leafHash = hashData(JSON.stringify(header));

    // Find the tree that contains this header
    const allTrees = merkleTreeStore.getAllTrees();

    const merkleTree = allTrees.find(tree =>
        tree.leaves.some(leaf => leaf.hash === leafHash)
    );

    if (!merkleTree) {
        return res.status(404).json({error: `Merkle tree not found for header with hash ${hash}`});
    }

    // Generate the Merkle inclusion proof
    const proof = merkleTree.generateInclusionProof(leafHash);
    if (!proof) {
        return res.status(404).json({error: `Inclusion proof could not be generated for hash ${hash}`});
    }

    res.json({
        leafHash,
        proof,
        rootHash: merkleTree.getRootHash(),
    });
});

router.post('/verify-proof', (req: Request, res: Response) => {
    const {leafHash, proof, rootHash} = req.body;

    if (!leafHash || !proof || !rootHash) {
        return res.status(400).json({error: 'Missing required parameters: leafHash, proof, rootHash'});
    }

    const isValid = verifyMerkleProof(leafHash, proof, rootHash);

    if (isValid) {
        res.json({success: true, message: 'The proof is valid.'});
    } else {
        res.json({success: false, message: 'The proof is invalid.'});
    }
});

export default router;
