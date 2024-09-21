import {Router, Request, Response} from 'express';
import {merkleTreeStore} from '../services/storeInstance';
import {hashData, verifyMerkleProof} from '../services/merkleTreeStore';

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

    // find the tree that contains this header
    const allTrees = merkleTreeStore.getAllTrees();

    const merkleTree = allTrees.find(tree =>
        tree.leaves.some(leaf => leaf.hash === leafHash)
    );

    if (!merkleTree) {
        return res.status(404).json({error: `Merkle tree not found for header with hash ${hash}`});
    }

    // generate the Merkle inclusion proof
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

router.get('/recent', (req: Request, res: Response) => {
    const recentHeaders = merkleTreeStore.getRecentHeaders();
    res.json(recentHeaders);
});

router.post('/verify-batch', async (req: Request, res: Response) => {
    const {hashes} = req.body;

    if (!hashes || !Array.isArray(hashes)) {
        return res.status(400).json({error: 'Invalid request body. Expected an array of hashes.'});
    }

    const allTrees = merkleTreeStore.getAllTrees();

    const verificationResults = await Promise.all(
        hashes.map(async (hash: string) => {
            try {
                const header = merkleTreeStore.getHeaderByHash(hash);

                if (!header) {
                    return {hash, isValid: false, error: 'Header not found'};
                }

                const leafHash = hashData(JSON.stringify(header));

                // find the tree that contains this header
                const merkleTree = allTrees.find((tree) =>
                    tree.leaves.some((leaf) => leaf.hash === leafHash)
                );

                if (!merkleTree) {
                    return {hash, isValid: false, error: 'Merkle tree not found'};
                }

                const proof = merkleTree.generateInclusionProof(leafHash);

                if (!proof) {
                    return {hash, isValid: false, error: 'Proof not found'};
                }

                const rootHash = merkleTree.getRootHash();

                if (!rootHash) {
                    return {hash, isValid: false, error: 'Root hash is null'};
                }

                const isValid = verifyMerkleProof(leafHash, proof, rootHash);

                return {hash, isValid};
            } catch (error) {
                return {hash, isValid: false, error: 'Verification failed'};
            }
        })
    );

    res.json({results: verificationResults});
});

export default router;
