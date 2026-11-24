import { useState, useEffect } from "react";
import { apiFetch } from "../api/client";
import { getRoomKey } from "../utils/storage"

export default function PairingManager() {
  const [activeCode, setActiveCode] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/pairing/generate-code", {
        method: "POST",
      });
      setActiveCode(res.code);
      setExpiresAt(new Date(Date.now() + res.expiresInSeconds * 1000));
      setCopied(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!activeCode) return;
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const fetchPending = async () => {
    try {
      const res = await apiFetch("/pairing/requests");
      setPendingRequests(res.requests || []);
    } catch {
      // ignore background polling errors
    }
  };

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRespond = async (requestId, decision) => {
    setError("");
    try {
      const roomKey = getRoomKey();

      await apiFetch(`/pairing/respond/${requestId}`, {
        method: "POST",
        body: JSON.stringify({
          action: decision,
          roomKey: decision === 'approve' ? roomKey : null,
        }),
      });
      fetchPending();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Device Pairing</h3>
          <p className="card-subtitle">Invite and approve nearby devices</p>
        </div>
        <button className="btn btn-secondary" onClick={handleGenerateCode} disabled={loading}>
          {loading ? "Generating..." : "New Code"}
        </button>
      </div>

      {error && <p className="alert-error">{error}</p>}

      {activeCode && (
        <div className="pairing-box">
          <div>
            <div className="mono pairing-code">{activeCode}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Expires at {expiresAt ? expiresAt.toLocaleTimeString() : ""}
            </div>
          </div>
          <button type="button" className="btn btn-ghost" onClick={handleCopyCode}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      {pendingRequests.length > 0 && (
        <>
          <div className="divider" />
          <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.6rem" }}>
            Pending Requests ({pendingRequests.length})
          </p>
          <ul className="request-list">
            {pendingRequests.map((req) => (
              <li key={req._id} className="request-item">
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{req.deviceName}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {new Date(req.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="btn-group">
                  <button
                    className="btn btn-primary"
                    style={{ padding: "0.35rem 0.7rem", fontSize: "0.78rem" }}
                    onClick={() => handleRespond(req._id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleRespond(req._id, "reject")}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
