import * as crypto from 'crypto-js';

export function hashData(data: string): string {
    return crypto.SHA256(data).toString();
}

export class MerkleNode {
    left: MerkleNode | null;
    right: MerkleNode | null;
    hash: string;

    constructor(hash: string, left: MerkleNode | null = null, right: MerkleNode | null = null) {
        this.hash = hash;
        this.left = left;
        this.right = right;
    }
}

export type MerkleProofStep = {
    siblingHash: string;
    position: 'left' | 'right';
};

export class MerkleTree {
    root: MerkleNode | null = null;
    leaves: MerkleNode[] = [];

    constructor(data: any[]) {
        this.leaves = data.map(item => new MerkleNode(hashData(JSON.stringify(item))));
        this.root = this.buildTree(this.leaves);
    }

    private buildTree(nodes: MerkleNode[]): MerkleNode | null {
        if (nodes.length === 0) {
            return null;
        }
        if (nodes.length === 1) {
            return nodes[0];
        }

        const parentNodes: MerkleNode[] = [];
        for (let i = 0; i < nodes.length; i += 2) {
            const left = nodes[i];
            const right = i + 1 < nodes.length ? nodes[i + 1] : nodes[i];
            const parentHash = hashData(left.hash + right.hash);
            parentNodes.push(new MerkleNode(parentHash, left, right));
        }
        return this.buildTree(parentNodes);
    }

    getRootHash(): string | null {
        return this.root ? this.root.hash : null;
    }


    //

    generateInclusionProof(leafHash: string): MerkleProofStep[] | null {
        const leafIndex = this.leaves.findIndex(leaf => leaf.hash === leafHash);
        if (leafIndex === -1) {
            return null; // Leaf not found
        }

        const proof: MerkleProofStep[] = [];
        let index = leafIndex;
        let currentLevel = this.leaves;

        while (currentLevel.length > 1) {
            const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;

            // Add sibling's hash to the proof if sibling exists
            if (siblingIndex < currentLevel.length) {
                const siblingHash = currentLevel[siblingIndex].hash;
                const position: 'left' | 'right' = index % 2 === 0 ? 'right' : 'left';
                proof.push({siblingHash, position});

                // Debugging output
                console.log(`At index ${index}, sibling index ${siblingIndex}, position: ${position}`);
                console.log(`Adding sibling hash: ${siblingHash}`);
            }

            // Move up the tree
            index = Math.floor(index / 2);
            currentLevel = this.buildParentLevel(currentLevel);
        }

        return proof;
    }


    // Helper function to build the next level up in the Merkle tree
    private buildParentLevel(nodes: MerkleNode[]): MerkleNode[] {
        const parentNodes: MerkleNode[] = [];
        for (let i = 0; i < nodes.length; i += 2) {
            const left = nodes[i];
            const right = i + 1 < nodes.length ? nodes[i + 1] : nodes[i];
            const parentHash = hashData(left.hash + right.hash);
            parentNodes.push(new MerkleNode(parentHash, left, right));
        }
        return parentNodes;
    }
}

// export function verifyMerkleProof(leafHash: string, proof: string[], rootHash: string): boolean {
//     let computedHash = leafHash;
//     console.log("--------------------------------------------------------------------------------------------");
//     console.log('Starting verification for leaf hash:', leafHash);
//     console.log('Proof:', proof);
//     console.log('Expected root hash:', rootHash);
//
//     proof.forEach((siblingHash, index) => {
//         console.log(`Step ${index + 1}:`);
//         console.log(`Current computed hash: ${computedHash}`);
//         console.log(`Sibling hash: ${siblingHash}`);
//
//         // Concatenate hashes in the correct left-right order
//         if (index % 2 === 0) { // Left node comes first
//             computedHash = hashData(computedHash + siblingHash);
//             console.log(`Hashing (left-right): ${computedHash} + ${siblingHash}`);
//         } else { // Right node comes first
//             computedHash = hashData(siblingHash + computedHash);
//             console.log(`Hashing (right-left): ${siblingHash} + ${computedHash}`);
//         }
//
//         console.log(`New computed hash: ${computedHash}`);
//     });
//
//     console.log(`Final computed hash: ${computedHash}`);
//     console.log(`Does the computed hash match the root hash? ${computedHash === rootHash}`);
//     console.log("--------------------------------------------------------------------------------------------");
//     return computedHash === rootHash;
// }

export function verifyMerkleProof(
    leafHash: string,
    proof: MerkleProofStep[],
    rootHash: string
): boolean {
    let computedHash = leafHash;

    proof.forEach(({siblingHash, position}, index) => {
        // Concatenate hashes based on the position
        if (position === 'left') {
            computedHash = hashData(siblingHash + computedHash);
        } else {
            computedHash = hashData(computedHash + siblingHash);
        }

        // Debugging output
        console.log(`Step ${index + 1}:`);
        console.log(`Position: ${position}`);
        console.log(`Sibling hash: ${siblingHash}`);
        console.log(`New computed hash: ${computedHash}`);
    });

    return computedHash === rootHash;
}


// in-memory storage
export class MerkleTreeStore {
    private trees: MerkleTree[] = [];

    // NOTE: this is O(2*n) in memory complexity, but for the simplicity of the PoC can be considered as acceptable
    private headerMapByHash: Map<string, any> = new Map();
    private headerMapByNumber: Map<string, any> = new Map();

    // Add a tree and its headers to the store
    addTree(tree: MerkleTree, headers: any[]) {
        this.trees.push(tree);

        // Index headers by block number and hash
        headers.forEach(header => {
            const headerHash = header.hash.toHex();
            const blockNumber = header.number.toString();

            // console.log(`debug: storing header with block number: ${blockNumber}, hash: ${headerHash}`);

            // store by hash and block number
            this.headerMapByHash.set(headerHash, header);
            this.headerMapByNumber.set(blockNumber, header);
        });
    }

    getHeaderByBlockNumber(blockNumber: string): any | null {
        console.log("DEBUG: get header with block number: " + blockNumber);
        return this.headerMapByNumber.get(blockNumber) || null;
    }

    getHeaderByHash(hash: string): any | null {
        return this.headerMapByHash.get(hash) || null;
    }

    getAllTrees(): MerkleTree[] {
        return this.trees;
    }
}
