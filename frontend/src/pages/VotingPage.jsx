import { useState, useEffect } from "react";

const API = "http://localhost:5000/api";

export default function VotingPage({ voter, onVoteSuccess }) {
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    fetch(`${API}/candidates`)
      .then(r => r.json())
      .then(d => { if (d.success) setCandidates(d.candidates); })
      .catch(() => setError("Failed to load candidates from blockchain"))
      .finally(() => setLoading(false));
  }, []);

  const handleVote = async () => {
    if (!selected) { setError("Please select a candidate"); return; }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voter_id: voter.voter_id, candidate_id: selected }),
      });
      const data = await res.json();
      if (data.success) {
        setTxHash(data.tx_hash);
        setTimeout(onVoteSuccess, 3000);
      } else {
        setError(data.message || "Vote failed");
      }
    } catch {
      setError("Cannot reach server.");
    } finally {
      setSubmitting(false);
    }
  };

  const initials = (name) => name.split(" ").map(w => w[0]).join("").slice(0, 2);

  if (txHash) {
    return (
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <p className="page-title">Vote Cast Successfully!</p>
          <p className="page-sub">Your vote has been permanently recorded on the blockchain.</p>
          <div className="alert alert-success" style={{ textAlign: "left", wordBreak: "break-all" }}>
            <strong>Transaction Hash:</strong><br />{txHash}
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Redirecting to results...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, width: "100%" }}>
      <div className="card">
        <p className="page-title">Cast Your Vote</p>
        <p className="page-sub">Welcome, {voter?.voter_name}. Select one candidate below.</p>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="candidate-grid" style={{ marginBottom: 24 }}>
              {candidates.map(c => (
                <div
                  key={c.id}
                  className={`candidate-card ${selected === c.id ? "selected" : ""}`}
                  onClick={() => setSelected(c.id)}
                >
                  <div className="candidate-avatar">{initials(c.name)}</div>
                  <div>
                    <div className="candidate-name">{c.name}</div>
                    <div className="candidate-party">{c.party}</div>
                  </div>
                  <div className="candidate-radio" />
                </div>
              ))}
            </div>

            {selected && (
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                You selected: <strong>{candidates.find(c => c.id === selected)?.name}</strong>. This action is irreversible.
              </div>
            )}

            <button
              className="btn btn-success btn-full"
              onClick={handleVote}
              disabled={!selected || submitting}
            >
              {submitting ? <><div className="spinner" /> Recording on blockchain...</> : "Submit Vote on Blockchain"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
