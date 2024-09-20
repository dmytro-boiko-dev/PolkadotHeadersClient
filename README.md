## Polkadot Block Headers Light Client

#### Project description:

- Project based with an Express server
- When the server start it connects to the Polkadot RPC via Web Socket and listens to new finalized block headers
- When 8 block headers received - server stores them in a Merkle tree
- For the trees storage used two maps: one with block number as a key, another with a block hash as a key accordingly
- O(2*n) in terms of memory complexity used for the simplicity of the PoC (two Maps used as a storage); can be optimised
  if needed or not in-memory storage can be used
- Implemented API endpoints to retrieve any stored header by hash or by block number
- Implemented API endpoint to generate Merkle inclusion proof
- Implemented API endpoint to verify the proof

#### Project structure:

```
/project-root
│
├── /src
│   ├── /api
│   │   └── headerRoutes.ts    # API endpoints for querying headers
│   ├── /services
│   │   └── merkleTreeStore.ts # Merkle tree and store logic
│   │   └── storeInstance.ts    # Singleton instance of MerkleTreeStore
│   └── server.ts              # Main Express server and WebSocket listener
├── package.json
└── tsconfig.json
```

### Setup and run the project

Install dependencies:

```shell
nom install
```

To start the project run:

```shell
npm start
```

### API endpoints description

#### 1. Get Header by Block Number

- URL: `/header/block/:number`
- Method: `GET`
- URL Parameter: `number` (required) – The block number of the header to retrieve
- Example request: `http://localhost:3000/header/block/22617359`
- Example response:

```json
{
  "parentHash": "0x1ba4670d0c683281c4eac98641d355a432ab553819038705dbfa2ab6aff146b4",
  "number": 22617359,
  "stateRoot": "0x706f6ee6f541b47588168ea4a749316fa7ee377e67510e6c25f598f3013c49ac",
  "extrinsicsRoot": "0xa90b5aa71e2e71eab2b9ca7300b265c3804a02e1c445652040c1dff1a6619321",
  "digest": {
    "logs": [
      "..."
    ]
  }
}
```

#### 2. Get Header by Block Hash

- URL: `/header/hash/:hash`
- Method: `GET`
- URL Parameter: `hash` (required) – The block hash of the header to retrieve
-
    - Example
      request: `http://localhost:3000/header/hash/0xef5306f029c96d2ce5292d54e50fee76fc2be0e24ba6de2747d0c07ec9065ca2`
- Example response: `same as for the block number endpoint`

#### 3. Get Merkle inclusion proof for a header by hash

- URL: `/header/proof/:hash`
- Method: `GET`
- URL Parameter: `hash` (required) – The hash of the block header to generate the inclusion proof for
- Example
  request: `http://localhost:3000/header/proof/0xef5306f029c96d2ce5292d54e50fee76fc2be0e24ba6de2747d0c07ec9065ca2`
- Example response:

```json
{
  "leafHash": "6718718016077adbe89783ccfb01b91f4f8596483936959c91dd461a254c71ba",
  "proof": [
    {
      "siblingHash": "ba45334a429e771548c02d85eb525eec0ff5b9af9e80bd46580982856036ff75",
      "position": "left"
    },
    {
      "siblingHash": "c54ba799d2c3078b351632257b757ca2e09546154518c76355c03aeca97f081b",
      "position": "right"
    },
    {
      "siblingHash": "e106030809728ef768b19e605cc03e37eb10808d565cee3632ec2f4d8c6a2a9e",
      "position": "left"
    }
  ],
  "rootHash": "d71e0d0773fd6aa6e87941cf00ec14fe877407b1b27ca6a1c864794ba1c129e1"
}
```

#### 4. Verify The Proof

- URL: `/header/verify-proof`
- Method: `POST`
- Example request body:

```json
{
  "leafHash": "6718718016077adbe89783ccfb01b91f4f8596483936959c91dd461a254c71ba",
  "proof": [
    {
      "siblingHash": "ba45334a429e771548c02d85eb525eec0ff5b9af9e80bd46580982856036ff75",
      "position": "left"
    },
    {
      "siblingHash": "c54ba799d2c3078b351632257b757ca2e09546154518c76355c03aeca97f081b",
      "position": "right"
    },
    {
      "siblingHash": "e106030809728ef768b19e605cc03e37eb10808d565cee3632ec2f4d8c6a2a9e",
      "position": "left"
    }
  ],
  "rootHash": "d71e0d0773fd6aa6e87941cf00ec14fe877407b1b27ca6a1c864794ba1c129e1"
}
```

- Example response:

```json
{
  "success": true,
  "message": "The proof is valid."
}
```