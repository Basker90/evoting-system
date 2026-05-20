import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";

const API = "http://localhost:5000/api";

export default function AuthPage({ onSuccess }) {
  const [tab, setTab] = useState("login");
  const [voterId, setVoterId] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const webcamRef = useRef(null);

  const handleProceed = () => {
    if (!voterId.trim()) { setError("Please enter your Voter ID"); return; }
    if (tab === "register" && !name.trim()) { setError("Please enter your name"); return; }
    setError(""); setSuccessMsg(""); setStep("capture");
  };

  const handleCapture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) { setError("Could not capture image. Allow camera access."); return; }
    setStep("loading"); setError("");

    const endpoint = tab === "register" ? "/register" : "/authenticate";
    const body = tab === "register"
      ? { voter_id: voterId, name, image: imageSrc }
      : { voter_id: voterId, image: imageSrc };

    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        if (tab === "register") {
          setSuccessMsg("Registered! Now login with your face.");
          setTab("login"); setStep("form"); setName("");
        } else {
          onSuccess({ voter_id: voterId, voter_name: data.voter_name });
        }
      } else {
        setError(data.message || "Failed"); setStep("capture");
      }
    } catch {
      setError("Cannot reach server. Make sure Flask backend is running.");
      setStep("capture");
    }
  }, [voterId, name, tab, onSuccess]);

  const switchTab = (t) => { setTab(t); setStep("form"); setError(""); setSuccessMsg(""); };

  return (
    <div style={{ maxWidth: 480, width: "100%" }}>
      <div className="card">
        <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4 }}>
          <button onClick={() => switchTab("login")} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, background: tab === "login" ? "#2563eb" : "transparent", color: tab === "login" ? "#fff" : "rgba(255,255,255,0.45)" }}>Login to Vote</button>
          <button onClick={() => switchTab("register")} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, background: tab === "register" ? "#2563eb" : "transparent", color: tab === "register" ? "#fff" : "rgba(255,255,255,0.45)" }}>Register Face</button>
        </div>

        <p className="page-title">{tab === "login" ? "Face Authentication" : "Register Your Face"}</p>
        <p className="page-sub">{tab === "login" ? "Enter your Voter ID and verify your face to vote" : "Register your face once to enable voting"}</p>

        {error && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {step === "form" && (
          <>
            {tab === "register" && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="e.g. Ravi Kumar" value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Voter ID</label>
              <input className="form-input" placeholder="e.g. TN-2024-00847" value={voterId} onChange={e => setVoterId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleProceed()} />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleProceed}>
              {tab === "login" ? "Continue to Face Scan →" : "Continue to Register Face →"}
            </button>
          </>
        )}

        {(step === "capture" || step === "loading") && (
          <>
            <div className="alert alert-info">
              {tab === "register" ? `Registering: ${name} (${voterId})` : `Voter ID: ${voterId}`} — position your face in the frame
            </div>
            <div className="cam-wrap" style={{ marginBottom: 16 }}>
              <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" className="cam-video" mirrored />
              <div className="cam-overlay"><div className="cam-oval" /></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setStep("form")} disabled={step === "loading"}>← Back</button>
              <button className="btn btn-primary btn-full" onClick={handleCapture} disabled={step === "loading"}>
                {step === "loading" ? <><div className="spinner" /> {tab === "register" ? "Registering..." : "Verifying..."}</> : tab === "register" ? "Register Face" : "Verify Face"}
              </button>
            </div>
          </>
        )}
      </div>
      <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
        Face data encrypted. Never stored as images. Powered by DeepFace + Blockchain.
      </p>
    </div>
  );
}
