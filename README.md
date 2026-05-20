# SecureVote — E-Voting System
### Face Recognition + Blockchain | Flask + React

---

## Project Structure

```
evoting/
├── smart_contract/
│   └── Voting.sol          # Solidity smart contract
├── backend/
│   ├── app.py              # Flask REST API
│   ├── deploy.py           # Contract deployment script
│   ├── contract_abi.json   # Generated after deployment
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   └── pages/
    │       ├── AuthPage.jsx    # Face capture & voter ID
    │       ├── VotingPage.jsx  # Ballot
    │       └── ResultsPage.jsx # Live blockchain results
    ├── package.json
    └── vite.config.js
```

---

## Setup Instructions

### Step 1 — Install Ganache (local blockchain)
Download from https://trufflesuite.com/ganache/ and start it on port 7545.

### Step 2 — Deploy the Smart Contract

```bash
cd backend
pip install py-solc-x web3
python deploy.py
```

Copy the printed `CONTRACT_ADDRESS` and set it as an environment variable:
```bash
export CONTRACT_ADDRESS=0xYourAddressHere
```

### Step 3 — Start Flask Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs on http://localhost:5000

### Step 4 — Start React Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

---

## How It Works

### Face Authentication
1. Voter enters their Voter ID
2. Webcam captures their face
3. DeepFace extracts a 128-dim face embedding
4. Cosine similarity is computed against the registered embedding
5. If similarity ≥ 0.75, authentication passes

### Blockchain Voting
1. After auth, candidates are fetched from the Ethereum smart contract
2. Voter selects a candidate and submits
3. Flask calls `castVote()` on the smart contract via Web3.py
4. The smart contract records the vote immutably and prevents double voting
5. Results are read directly from the blockchain — no central database

### Security Features
- **Liveness**: DeepFace enforce_detection rejects photos/videos
- **Double vote prevention**: Smart contract tracks used voter IDs on-chain
- **Immutability**: Votes on blockchain cannot be altered or deleted
- **Face privacy**: Only embeddings (hashed vectors) are stored, never raw images

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Check server + blockchain status |
| POST | /api/register | Register voter with face |
| POST | /api/authenticate | Authenticate voter by face |
| GET | /api/candidates | Get candidates from blockchain |
| POST | /api/vote | Cast vote on blockchain |
| GET | /api/results | Get live results from blockchain |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, react-webcam |
| Backend | Python, Flask, Flask-CORS |
| Face Recognition | DeepFace (Facenet model), OpenCV |
| Blockchain | Ethereum (Ganache local), Solidity 0.8 |
| Web3 Bridge | Web3.py |
