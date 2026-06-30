# N-DISC Blockchain Infrastructure Developer Documentation

## Project Overview

N-DISC Blockchain Infrastructure is a full-stack certificate/document verification system for Polygon Amoy testnet. It allows an approved backend issuer wallet to create blockchain-anchored certificates, generate downloadable PDF certificates, upload those PDFs to Pinata/IPFS, and verify certificates through transaction ID or certificate details.

The project includes:

- Frontend certificate creation and verification pages.
- Server-side certificate issuing through an approved issuer wallet.
- Upgradeable Solidity smart contract using OpenZeppelin roles.
- PDF certificate generation with optional logo and signature PNG uploads.
- QR code verification links that point to the live verify page.
- Pinata cloud upload for storing generated certificate PDFs.
- Crypto Crime Glossary awareness section on the homepage.

## Live Deployment

Current live app:

```text
https://ndiscblockchaininfrastructure.onrender.com
```

Current Polygon Amoy contract:

```text
0x85Dbb2B7172A404ea302F66266F7Db19E47709C7
```

Current backend issuer wallet:

```text
0x006AeAc4bee5e0e3aa84e2f0eF256a27deDF7cFF
```

## Important Architecture

The app does not require MetaMask for issuing certificates. Certificate issuing happens from the backend using the private key configured in the backend environment.

The backend wallet must have `ISSUER_ROLE` on the deployed contract. The current recipient wallet already has this role because it deployed the current contract.

Verification is public and can happen by:

- Transaction ID.
- Manual certificate details.

## Main Files

```text
index.html                         Frontend structure
styles.css                         Frontend styling
app.js                             Frontend logic, PDF generation, QR generation
server.js                          Express backend and Pinata/blockchain APIs
contracts/NCFLCertificateVerifier.sol   Smart contract
scripts/deploy-amoy.js             Deploy upgradeable contract
scripts/grant-issuer.js            Grant issuer role to another wallet
scripts/upgrade-amoy.js            Upgrade deployed proxy contract
deployments/amoy.json              Current deployed contract metadata
render.yaml                        Render deployment blueprint
.env.example                       Environment variable template
```

## Required Environment Variables

Create a `.env` file for local development or set these in Render Environment Variables.

```env
PRIVATE_KEY=backend_issuer_wallet_private_key
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
CONTRACT_ADDRESS=0x85Dbb2B7172A404ea302F66266F7Db19E47709C7
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
PUBLIC_APP_URL=https://ndiscblockchaininfrastructure.onrender.com
PINATA_JWT=pinata_jwt
PINATA_API_KEY=pinata_api_key
PINATA_SECRET_API_KEY=pinata_secret_api_key
```

For this transfer package, the included `.env` is already prefilled.

## Local Setup

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Start local server:

```bash
npm start
```

Open:

```text
http://localhost:5173
```

Create page:

```text
http://localhost:5173/create
```

Verify page:

```text
http://localhost:5173/verify
```

## Render Deployment

Use Render Web Service.

Recommended settings:

```text
Environment: Node
Build Command: npm install
Start Command: npm start
Plan: Free or higher
```

Set all `.env` values in Render Environment Variables.

The deployed domain should match:

```env
PUBLIC_APP_URL=https://your-render-service-name.onrender.com
```

This is important because certificate QR codes use `PUBLIC_APP_URL`.

## Deploying a New Smart Contract

Use this only if the new owner wants a fresh contract.

1. Put the new deployer wallet private key in `.env`:

```env
PRIVATE_KEY=new_deployer_wallet_private_key
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

2. Fund the wallet with Polygon Amoy test POL.

3. Compile and deploy:

```bash
npm run compile
npm run deploy:amoy
```

4. Copy the new `proxyAddress` from:

```text
deployments/amoy.json
```

5. Set it as:

```env
CONTRACT_ADDRESS=new_proxy_address
```

6. Redeploy the backend.

The deployer wallet automatically receives:

- `DEFAULT_ADMIN_ROLE`
- `ISSUER_ROLE`
- `UPGRADER_ROLE`

## Adding Another Issuer Wallet

Only an admin wallet can grant issuer role.

Set:

```env
PRIVATE_KEY=admin_wallet_private_key
ISSUER_ADDRESS=wallet_to_make_issuer
```

Run:

```bash
npm run grant-issuer:amoy
```

## Certificate Creation Flow

1. User opens `/create`.
2. User fills certificate details.
3. Optional logo PNG and signature PNG can be uploaded.
4. Backend hashes the certificate details.
5. Backend issuer wallet submits the transaction to Polygon Amoy.
6. Frontend generates PDF.
7. PDF can be uploaded to Pinata/IPFS.
8. QR code points to `/verify?verify=1&txHash=...`.

## PDF Certificate Notes

The PDF certificate currently includes:

- Optional logo at centre top.
- Certificate title.
- Recipient name.
- Title.
- Description.
- Duration.
- Issued by.
- Certificate ID.
- TX ID.
- Optional signature image above Authorized Signature.
- QR code for blockchain verification.

The PDF no longer displays Block ID.

## Verification Flow

Verification by transaction ID:

1. User enters transaction hash/TX ID.
2. Backend fetches transaction receipt from Polygon Amoy.
3. Backend reads `CertificateIssued` event.
4. Backend checks the certificate hash on-chain.
5. If a stored Pinata PDF exists, the download link is shown.

Verification by manual details:

1. User enters exact certificate details.
2. Backend hashes the details.
3. Backend checks the hash on-chain.
4. Verification result is shown.

## Cloud Upload

Cloud upload uses Pinata.

Endpoint:

```text
POST /api/upload-certificate
```

The uploaded file is named using the transaction hash when available.

Large PNG logo/signature uploads are resized in-browser before being embedded in the PDF to keep cloud upload reliable.

## Security Notes

- Never commit `.env` publicly.
- Never expose `PRIVATE_KEY`.
- Never expose Pinata JWT or API secret publicly.
- Rotate Render API keys after handoff if they were shared in chat.
- Use a dedicated issuer wallet, not a personal wallet.
- Keep enough Amoy POL in the backend issuer wallet for gas.

## Handoff Checklist

- Confirm Render service is live.
- Confirm `/api/config` returns the expected contract and domain.
- Confirm issuer wallet has issuer role.
- Issue one test certificate.
- Download the PDF and confirm layout.
- Verify the certificate by TX ID.
- Verify the certificate by manual details.
- Scan the QR code and confirm it opens the live verify page.
- Confirm cloud PDF upload works.

