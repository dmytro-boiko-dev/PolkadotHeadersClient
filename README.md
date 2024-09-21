# Polkadot Block Headers Light Client

### Project description:

- The project consists of backend and frontend apps
- The backend app based on an Express server
- The frontend app uses React
- When the backend server start it connects to the Polkadot RPC via Web Socket and listens to headers of the finalized blocks 
- When 8 block headers received - server stores them in a Merkle tree
- For the trees storage used two maps: one with block number as a key, another with a block hash as a key accordingly
- O(2*n) in terms of memory complexity used for the simplicity of the PoC (two Maps used as a storage); can be optimised
  if needed or not in-memory storage can be used
- Implemented API endpoints to:
  - retrieve any stored header by hash or by block number
  - generate Merkle inclusion proof
  - verify the proof
  - get recent hashes
  - batch verifying 

- The backend runs on port 3000.
- The frontend runs on port 4000. 


#### Project structure:

```
polkadot-headers-client/
├── package.json            # Root(monorepo) package.json with workspaces and scripts
├── README.md               # Project README file
├── backend/
│   ├── package.json        # Backend package.json
│   ├── src/
│   │   ├── server.ts       # Entry point for backend server
│   │   ├── api/
│   │   │   └── headerRoutes.ts     # Express routes for headers
│   │   ├── services/
│   │   │   ├── merkleTreeStore.ts  # Store for Merkle Trees and headers
│   │   │   └── storeInstance.ts    # Singleton instance of MerkleTreeStore
├── frontend/
│   ├── package.json        # Frontend package.json
│   ├── public/
│   │   └── index.html      # HTML template
│   ├── src/
│   │   ├── index.tsx       # Entry point for frontend
│   │   ├── App.tsx         # Main App component
│   │   ├── App.css         # Global styles
│   │   ├── components/
│   │   │   ├── HeaderList.tsx  # Component displaying list of headers
│   │   │   └── HeaderItem.tsx  # Component displaying individual header
│   │   └── services/
│   │       └── api.ts      # API service functions
└── node_modules/           # Root dependencies

```

### Setup and run the project

Install dependencies:

```shell
npm install
```

To start the project run:

```shell
npm start
```

## Backend API endpoints description

### 1. Get Header by Block Number

- URL: `/headers/block/:number`
- Method: `GET`
- URL Parameter: `number` (required) – The block number of the header to retrieve
- Example request: `http://localhost:3000/headers/block/22617359`
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

### 2. Get Header by Block Hash

- URL: `/headers/hash/:hash`
- Method: `GET`
- URL Parameter: `hash` (required) – The block hash of the header to retrieve
-
    - Example
      request: `http://localhost:3000/headers/hash/0xef5306f029c96d2ce5292d54e50fee76fc2be0e24ba6de2747d0c07ec9065ca2`
- Example response: `same as for the block number endpoint`

### 3. Get Merkle inclusion proof for a header by hash

- URL: `/headers/proof/:hash`
- Method: `GET`
- URL Parameter: `hash` (required) – The hash of the block header to generate the inclusion proof for
- Example
  request: `http://localhost:3000/headers/proof/0xef5306f029c96d2ce5292d54e50fee76fc2be0e24ba6de2747d0c07ec9065ca2`
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

### 4. Verify The Proof

- URL: `/headers/verify-proof`
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

### 5. Get recent headers

- URL: `/headers/recent`
- Method: `GET`

- Example response:

```json
[
  {
    "hash": "0xb8e90c23f6d58f724ba997e43b8ce771f16a27691dc28edc8b8568afb2877ac7",
    "header": {
      // header data
    }
  },
  {
    "hash": "0xf744fb41884cf4f709fa0db9d0d4800aa0f9bd2b328a5afe18860cf1bd9fb2b0",
    "header": {
      // header data
    }
  },
  {
    "hash": "0xefb9722f0ea7133b973a5d473d0f7323493f452cd934aeaab8d70cef2e53d814",
    "header": {
      // header data
    }
  }
]
```

### 6. Batch verify

- URL: `/headers/verify-batch`
- Method: `POST`
- Example request body:

```json
{
	"hashes": [
		"0xefba1be92dcce272787925c3810c4d2322afdadb25ebde44f333a0f5bc5675ec",
		"0xd053082bb42604218ff5c7b0f7b9d4e2797d7fe1285b48070a6ab576a0160420",
		"0x4b00c10fa243235b52b479a76ea83075adf9418017f1c6371d739b686fceac45",
		"0xb4dd5e4c9249531edc7580f5767f7b9c7329236694e5815c027ebc4488371420",
		"0xbf8609566be6ce4eb4fb95647b9cc0964eb65e841ae69f5d4eba355adaf051e8",
		"0x03054bb20fb4a212d72dddbd973c860955ff3e69096de18f39a1cdd3efd3680c",
		"0xd6a5d2781c9ace600625ef1bd678a04e24370a258a7877e8749bfb4fe1c2319b",
		"0x74c0ec17ae83e74f88b5893bdfee91aa82d8889beaf0f9f972c7db6a079b387c"
	]
}
```

- Example response:

```json
{
  "results": [
    {
      "hash": "0xefba1be92dcce272787925c3810c4d2322afdadb25ebde44f333a0f5bc5675ec",
      "isValid": true
    },
    {
      "hash": "0xd053082bb42604218ff5c7b0f7b9d4e2797d7fe1285b48070a6ab576a0160420",
      "isValid": true
    },
    {
      "hash": "0x4b00c10fa243235b52b479a76ea83075adf9418017f1c6371d739b686fceac45",
      "isValid": true
    },
    {
      "hash": "0xb4dd5e4c9249531edc7580f5767f7b9c7329236694e5815c027ebc4488371420",
      "isValid": true
    },
    {
      "hash": "0xbf8609566be6ce4eb4fb95647b9cc0964eb65e841ae69f5d4eba355adaf051e8",
      "isValid": true
    },
    {
      "hash": "0x03054bb20fb4a212d72dddbd973c860955ff3e69096de18f39a1cdd3efd3680c",
      "isValid": true
    },
    {
      "hash": "0xd6a5d2781c9ace600625ef1bd678a04e24370a258a7877e8749bfb4fe1c2319b",
      "isValid": true
    },
    {
      "hash": "0x74c0ec17ae83e74f88b5893bdfee91aa82d8889beaf0f9f972c7db6a079b387c",
      "isValid": true
    }
  ]
}
```