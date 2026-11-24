import { useState } from "react";
import { apiFetch } from "../api/client";
import { encryptText } from "../utils/crypto";

export default function ShareTextLink({ onItemShared }) {
  const [content, setContent] = useState("");
  const [type, setType] = useState("text"); // 'text' | 'link'
  const [expiry, setExpiry] = useState("10m");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) return;

    setLoading(true);
    try {
      const encryptedContent = await encryptText(content.trim());

      await apiFetch("/items/text-link", {
        method: "POST",
        body: JSON.stringify({
          type,
          content: encryptedContent,
          expiry,
          isEncrypted: true,
        }),
      });

      setContent("");
      if (onItemShared) onItemShared();

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <div className="card-header">
        <h3 className="card-title">Share to Room</h3>
      </div>

      {error && <p className="alert-error">{error}</p>}

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="field-row">
          <div className="field">
            <label htmlFor="share-type">Type</label>
            <select id="share-type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="text">Plain Text / Note</option>
              <option value="link">Web Link / URL</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="share-expiry">Expires In</label>
            <select id="share-expiry" value={expiry} onChange={(e) => setExpiry(e.target.value)}>
              <option value="2m">2 minutes</option>
              <option value="10m">10 minutes</option>
              <option value="30m">30 minutes</option>
              <option value="1h">1 hour</option>
              <option value="2h">2 hours</option>
              <option value="3h">3 hours</option>
              <option value="1d">1 day</option>
              <option value="2d">2 days</option>
              <option value="3d">3 days</option>
            </select>
          </div>
        </div>

        <div className="field">
          <textarea
            rows="3"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={type === "link" ? "https://example.com" : "Paste text, code snippet, or note..."}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Sharing..." : "Send"}
        </button>
      </form>
    </section>
  );
}
