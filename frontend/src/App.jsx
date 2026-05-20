import { useState } from "react";
import AuthPage from "./pages/AuthPage";
import VotingPage from "./pages/VotingPage";
import ResultsPage from "./pages/ResultsPage";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("auth"); // auth | voting | results
  const [voter, setVoter] = useState(null);  // { voter_id, voter_name }

  const handleAuthSuccess = (voterData) => {
    setVoter(voterData);
    setPage("voting");
  };

  const handleVoteSuccess = () => {
    setPage("results");
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🗳</span>
            <span>SecureVote</span>
          </div>
          <nav className="steps">
            <span className={`step ${page === "auth" ? "active" : page !== "auth" ? "done" : ""}`}>1. Authenticate</span>
            <span className="step-sep">›</span>
            <span className={`step ${page === "voting" ? "active" : page === "results" ? "done" : ""}`}>2. Vote</span>
            <span className="step-sep">›</span>
            <span className={`step ${page === "results" ? "active" : ""}`}>3. Results</span>
          </nav>
          {voter && <div className="voter-badge">👤 {voter.voter_name}</div>}
        </div>
      </header>

      <main className="app-main">
        {page === "auth" && <AuthPage onSuccess={handleAuthSuccess} />}
        {page === "voting" && <VotingPage voter={voter} onVoteSuccess={handleVoteSuccess} />}
        {page === "results" && <ResultsPage />}
      </main>
    </div>
  );
}
