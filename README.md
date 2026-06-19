# NCFL Blockchain Verification System

A scalable Polygon Amoy dApp for issuing and verifying internship certificates.

## What This Version Supports

- Upgradeable UUPS smart contract for future contract improvements.
- `DEFAULT_ADMIN_ROLE`, `ISSUER_ROLE`, and `UPGRADER_ROLE`.
- Certificate issuing by approved issuer wallets only.
- Certificate verification by transaction hash or manual details.
- Revocation support for incorrect or cancelled certificates.
- Batch issuing support for large internship programs.
- Minimal on-chain storage: certificate hash, issuer, timestamps, revoked status, metadata URI.
- Full certificate PDF generation with QR verification.
- Local PDF generation uses vendored browser libraries, so it does not depend on CDN scripts.
- Optional Pinata/IPFS upload stores the PDF as `<transaction-hash>.pdf`.
- Backend registry stores the uploaded PDF URI so verified certificates can be downloaded again without a second wallet transaction.
- QR scan reconstructs certificate details and lets the verifier confirm the hash on Polygon Amoy.

## Project Files

- `contracts/NCFLCertificateVerifier.sol` - scalable upgradeable smart contract.
- `scripts/deploy-amoy.js` - deploys the upgradeable proxy to Polygon Amoy.
- `scripts/upgrade-amoy.js` - upgrades the proxy implementation later.
- `scripts/grant-issuer.js` - grants issuer permission to another wallet.
- `test/NCFLCertificateVerifier.test.js` - contract tests.
- `index.html`, `styles.css`, `app.js` - frontend dApp.
- `vendor/` - local browser builds for Ethers, jsPDF, and QR generation.

## Local Setup

```bash
npm install
npm run compile
npm test
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Polygon Amoy Deployment

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Open `.env` and set:

```text
PRIVATE_KEY=your_deployer_wallet_private_key
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGONSCAN_API_KEY=optional_polygonscan_api_key
```

Use a test wallet only. Do not use a wallet holding real funds.

3. Add Polygon Amoy to MetaMask:

```text
Network name: Polygon Amoy
RPC URL: https://rpc-amoy.polygon.technology
Chain ID: 80002
Currency symbol: POL
Explorer: https://amoy.polygonscan.com
```

4. Get Amoy test POL for the deployer wallet.

5. Deploy:

```bash
npm run deploy:amoy
```

6. Copy `proxyAddress` from:

```text
deployments/amoy.json
```

7. Set `CONTRACT_ADDRESS` in backend `.env`. The frontend loads it automatically from `/api/config`.

## Downloading And Cloud-Storing Certificates

The app now supports two certificate PDF paths:

1. **Local download**

After a certificate is issued on-chain, click:

```text
Download Certificate PDF
```

The PDF is generated in the browser and downloaded immediately.

2. **Cloud/IPFS storage**

Create a free Pinata account, then create either a JWT or an API key plus API secret with pinning permission. Store it in backend `.env`, not in the frontend.

When issuing a certificate, the app will:

```text
Issue certificate on Polygon Amoy
        ↓
Use the issue transaction hash as the PDF filename
        ↓
Upload <transaction-hash>.pdf to IPFS through Pinata
        ↓
Store the IPFS URI in the backend registry
        ↓
Store ipfs://... on-chain for future download
```

When the certificate is verified later, the app shows a **Download stored certificate** link if the on-chain metadata URI is an `ipfs://`, `https://`, or `http://` URL.

The frontend never receives the Pinata credential. It only sends the generated PDF to the local backend endpoint.

## Grant Another Issuer Wallet

Set this in `.env`:

```text
ISSUER_ADDRESS=0xIssuerWalletAddress
```

Then run:

```bash
npm run grant-issuer:amoy
```

Only wallets with `ISSUER_ROLE` can create certificates.

## Future Upgrades

After changing the contract safely, run:

```bash
npm run upgrade:amoy
```

The proxy address stays the same, so existing QR codes and integrations keep working.

## Scalable Certificate Storage Model

On-chain:

```text
certificateHash
issuer
issuedAt
revokedAt
stored PDF URI
```

Off-chain / IPFS:

```text
student name
internship title
duration
certificate ID
skills
PDF certificate
organization metadata
```

For production, the backend uploads the PDF to IPFS and stores the resulting `ipfs://...` URI on-chain automatically after the issue transaction.

## Verification Flow

```text
Verifier scans QR or enters details
        ↓
Frontend recomputes certificate hash
        ↓
Smart contract checks hash on Polygon
        ↓
App shows valid, revoked, or not found
```

## Production Notes

- Use a dedicated deployer wallet, not your personal wallet.
- Store private keys in `.env` locally only; never commit `.env`.
- Use IPFS/Filecoin/Pinata/NFT.Storage or your backend for metadata and PDFs.
- Keep only hashes and URIs on-chain to reduce gas costs.
- Use `ISSUER_ROLE` for organizations or admins that are allowed to issue.
- Use revocation instead of deleting records, because blockchain records should remain auditable.
