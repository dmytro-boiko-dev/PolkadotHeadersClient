import express from 'express';
import {ApiPromise, WsProvider} from '@polkadot/api';
import headerRoutes from './api/headerRoutes';
import {MerkleTree, merkleTreeStore} from './services/storeInstance';  // Import the shared instance
import cors from 'cors';

const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());
app.use('/headers', headerRoutes);

async function listenToHeadersAndStore(api: ApiPromise, batchSize: number) {
    let headerBatch: any[] = [];

    console.log("--------------------------------------------------------------------------------------------");

    // Subscribe to new block headers
    // subscribeNewHeads() - this one not used since it allows duplicates while blocks are not finalized yet
    await api.rpc.chain.subscribeFinalizedHeads(async (header) => {
        console.log(`New header: block #${header.number}, hash: ${header.hash}`);

        // add header to the batch
        headerBatch.push(header);

        // if the batch size reaches the defined limit, create a Merkle tree and reset the batch
        if (headerBatch.length >= batchSize) {
            const merkleTree = new MerkleTree(headerBatch);
            merkleTreeStore.addTree(merkleTree, headerBatch);

            console.log(`Stored Merkle tree with root: ${merkleTree.getRootHash()}`);

            headerBatch = [];
        }
    });
}

app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);

    // create a WebSocket connection to a Polkadot RPC
    const wsProvider = new WsProvider('wss://rpc.polkadot.io');
    const api = await ApiPromise.create({provider: wsProvider});

    const batchSize = 8; // small batch size set for tests purposes
    await listenToHeadersAndStore(api, batchSize);

    console.log('WebSocket listener started and headers are being stored.');
});
