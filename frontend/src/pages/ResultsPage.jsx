import { useState, useEffect } from "react";

const API = "http://localhost:5000/api";

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/results`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setResults(d.results); setTotal(d.totalVotes); }
        else setError(d.message);
      })
      .catch(() => setError("Cannot load results from blockchain"))
      .finally(() => setLoading(false));
  }, []);

  const winner = results[0];

  return (
    <div style={{ maxWidth: 580, width: "100%" }}>
      <div className="card">
        <p className="page-title">Live Election Results</p>
        <p className="page-sub">Results fetched directly from the blockchain — tamper-proof and transparent</p>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Total votes</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: "#fff" }}>{total}</div>
              </div>
              {winner && (
                <div style={{ flex: 2, background: "rgba(5,150,105,0.1)", border: "1px solid rgba(5,150,105,0.25)", borderRadius: 10, padding: "14px 18px" }}>
                  <div style={{ fontSize: 12, color: "rgba(110,231,183,0.7)", marginBottom: 4 }}>Leading candidate</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#6ee7b7" }}>{winner.name}</div>
                  <div style={{ fontSize: 13, color: "rgba(110,231,183,0.6)" }}>{winner.party} — {winner.percentage}%</div>
                </div>
              )}
            </div>

            <div>
              {results.map((r, i) => (
                <div key={r.id} className="result-row">
                  <div className="result-meta">
                    <span className="result-name">{r.name} {i === 0 && total > 0 && "🏆"}</span>
                    <span className="result-count">{r.voteCount} votes ({r.percentage}%)</span>
                  </div>
                  <div className="result-bar-track">
                    <div
                      className={`result-bar-fill ${i === 0 ? "winner" : ""}`}
                      style={{ width: `${r.percentage}%` }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{r.party}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              🔗 All votes are immutably recorded on the Ethereum blockchain. Results cannot be altered by any party.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
