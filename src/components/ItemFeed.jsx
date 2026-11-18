import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api/client";

export default function ItemFeed({ refreshTrigger }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await apiFetch("/items");
      const list = res.items || (Array.isArray(res) ? res : []);
      setItems(list);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 3000);
    return () => clearInterval(interval);
  }, [fetchItems, refreshTrigger]);

  const handleDelete = async (itemId) => {
    try {
      await apiFetch(`/items/${itemId}`, {
        method: "DELETE",
      });
      setItems((prev) => prev.filter((item) => item._id !== itemId));
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleCopy = (item) => {
    navigator.clipboard.writeText(item.content);
    setCopiedId(item._id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <section className="card">
      <div className="card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <h3 className="card-title">Room Feed</h3>
          <span className="badge">{items.length}</span>
        </div>
        <button className="btn btn-ghost" onClick={fetchItems}>
          Refresh
        </button>
      </div>

      {error && <p className="alert-error">{error}</p>}
      {loading && items.length === 0 && <p className="empty-state">Loading items...</p>}
      {!loading && items.length === 0 && (
        <p className="empty-state">Nothing shared yet. Drop a note or link above.</p>
      )}

      <ul className="feed-list">
        {items.map((item) => {
          const isLink = item.type === "link";
          const expiresT = item.expiresAt
            ? new Date(item.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "No Expiry";

          return (
            <li key={item._id} className="feed-item">
              <div className="feed-item-top">
                <div className="feed-meta">
                  <strong style={{ color: "var(--text)" }}>
                    {item.senderDeviceId?.name || "Device"}
                  </strong>
                  <span>•</span>
                  <span className="badge">{item.type}</span>
                  <span>•</span>
                  <span>Exp {expiresT}</span>
                </div>

                <div className="btn-group">
                  <button className="btn btn-ghost" onClick={() => handleCopy(item)}>
                    {copiedId === item._id ? "Copied" : "Copy"}
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(item._id)}>
                    Delete
                  </button>
                </div>
              </div>

              <div>
                {isLink ? (
                  <a
                    className="feed-link"
                    href={item.content.startsWith("http") ? item.content : `https://${item.content}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.content}
                  </a>
                ) : (
                  <p className="feed-content">{item.content}</p>
                )}
              </div>

              {item.fileData && item.fileData.url && (
                <div>
                  <a
                    className="btn btn-secondary"
                    style={{ textDecoration: "none", fontSize: "0.78rem" }}
                    href={item.fileData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download {item.fileData.originalName || "File"}
                  </a>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
