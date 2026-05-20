from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
import json
import numpy as np
import cv2
from deepface import DeepFace
from web3 import Web3
import tempfile

app = Flask(__name__)
CORS(app)

# ── Blockchain setup ──────────────────────────────────────────────────────────
GANACHE_URL = os.getenv("GANACHE_URL", "http://127.0.0.1:7545")
CONTRACT_ADDRESS = "0x1F2248D7fC15c219F9D10788bbf36d29B0Ec9D0e" # Fill after deploying
ABI_PATH = os.path.join(os.path.dirname(__file__), "contract_abi.json")

w3 = Web3(Web3.HTTPProvider(GANACHE_URL))

def get_contract():
    if not CONTRACT_ADDRESS:
        raise RuntimeError("CONTRACT_ADDRESS not set. Deploy the smart contract first.")
    with open(ABI_PATH) as f:
        abi = json.load(f)
    return w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=abi)


# ── Face database (in-memory for demo; use a DB in production) ───────────────
# Structure: { voter_id: { "embedding": [...], "name": str } }
REGISTERED_FACES = {}


def decode_image(b64_string: str) -> np.ndarray:
    """Decode a base64 image string to an OpenCV numpy array."""
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    img_bytes = base64.b64decode(b64_string)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img


def get_embedding(img: np.ndarray) -> list:
    """Extract face embedding using DeepFace."""
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        cv2.imwrite(tmp.name, img)
        tmp_path = tmp.name
    try:
        result = DeepFace.represent(img_path=tmp_path, model_name="Facenet", enforce_detection=True)
        return result[0]["embedding"]
    finally:
        os.unlink(tmp_path)


def cosine_similarity(a: list, b: list) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    connected = w3.is_connected()
    return jsonify({"status": "ok", "blockchain": "connected" if connected else "disconnected"})


@app.route("/api/register", methods=["POST"])
def register_voter():
    """Register a voter with their face image."""
    data = request.json
    voter_id = data.get("voter_id")
    name = data.get("name")
    image_b64 = data.get("image")

    if not all([voter_id, name, image_b64]):
        return jsonify({"success": False, "message": "voter_id, name, and image are required"}), 400

    if voter_id in REGISTERED_FACES:
        return jsonify({"success": False, "message": "Voter already registered"}), 409

    img = decode_image(image_b64)
    if img is None:
        return jsonify({"success": False, "message": "Invalid image"}), 400

    try:
        embedding = get_embedding(img)
    except Exception as e:
        return jsonify({"success": False, "message": f"Face not detected: {str(e)}"}), 422

    REGISTERED_FACES[voter_id] = {"embedding": embedding, "name": name}
    return jsonify({"success": True, "message": "Voter registered successfully"})


@app.route("/api/authenticate", methods=["POST"])
def authenticate_voter():
    """Authenticate voter by comparing live face with registered face."""
    data = request.json
    voter_id = data.get("voter_id")
    image_b64 = data.get("image")

    if not voter_id or not image_b64:
        return jsonify({"success": False, "message": "voter_id and image are required"}), 400

    if voter_id not in REGISTERED_FACES:
        return jsonify({"success": False, "message": "Voter not registered"}), 404

    img = decode_image(image_b64)
    if img is None:
        return jsonify({"success": False, "message": "Invalid image"}), 400

    try:
        live_embedding = get_embedding(img)
    except Exception as e:
        return jsonify({"success": False, "message": f"Face not detected: {str(e)}"}), 422

    stored = REGISTERED_FACES[voter_id]
    similarity = cosine_similarity(live_embedding, stored["embedding"])
    THRESHOLD = 0.75

    if similarity >= THRESHOLD:
        # Check if already voted on blockchain
        try:
            contract = get_contract()
            already_voted = contract.functions.hasVoterVoted(voter_id).call()
            if already_voted:
                return jsonify({"success": False, "message": "This voter has already cast their vote"}), 403
        except Exception as e:
            return jsonify({"success": False, "message": f"Blockchain error: {str(e)}"}), 500

        return jsonify({
            "success": True,
            "message": "Authentication successful",
            "voter_name": stored["name"],
            "similarity": round(similarity, 4)
        })
    else:
        return jsonify({
            "success": False,
            "message": "Face authentication failed. Please try again.",
            "similarity": round(similarity, 4)
        }), 401


@app.route("/api/candidates", methods=["GET"])
def get_candidates():
    """Get list of candidates from blockchain."""
    try:
        contract = get_contract()
        count = contract.functions.getCandidatesCount().call()
        candidates = []
        for i in range(1, count + 1):
            cid, name, party, votes = contract.functions.getCandidate(i).call()
            candidates.append({"id": cid, "name": name, "party": party, "voteCount": votes})
        return jsonify({"success": True, "candidates": candidates})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/vote", methods=["POST"])
def cast_vote():
    """Cast a vote on the blockchain."""
    data = request.json
    voter_id = data.get("voter_id")
    candidate_id = data.get("candidate_id")

    if not voter_id or not candidate_id:
        return jsonify({"success": False, "message": "voter_id and candidate_id are required"}), 400

    try:
        contract = get_contract()
        account = w3.eth.accounts[0]
        tx_hash = contract.functions.castVote(
            int(candidate_id), voter_id
        ).transact({"from": account, "gas": 200000})
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        return jsonify({
            "success": True,
            "message": "Vote cast successfully on the blockchain",
            "tx_hash": receipt.transactionHash.hex(),
            "block_number": receipt.blockNumber
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/results", methods=["GET"])
def get_results():
    """Get voting results from blockchain."""
    try:
        contract = get_contract()
        count = contract.functions.getCandidatesCount().call()
        total = contract.functions.totalVotes().call()
        results = []
        for i in range(1, count + 1):
            cid, name, party, votes = contract.functions.getCandidate(i).call()
            percentage = round((votes / total * 100), 2) if total > 0 else 0
            results.append({"id": cid, "name": name, "party": party, "voteCount": votes, "percentage": percentage})
        results.sort(key=lambda x: x["voteCount"], reverse=True)
        return jsonify({"success": True, "results": results, "totalVotes": total})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
