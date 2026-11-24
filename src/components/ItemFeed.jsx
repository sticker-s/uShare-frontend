import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api/client";
import { decryptText, decryptFileFromUrl } from "../utils/crypto";

export default function ItemFeed({ refreshTrigger }) {
  const [items, setItems] = useState([]);
  const [decryptedTexts, setDecryptedTexts] = useState({});
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await apiFetch("/items");
      const list = res.items || res.data || (Array.isArray(res) ? res : []);
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

  useEffect(() => {
    async function runDecryption() {
      const res = {};
      for (const item of items) {
        if (item.type !== 'file') {
          res[item._id] = await decryptText(item.content);
        }
      }
      setDecryptedTexts(res);
    }
    runDecryption();
  }, [items]);

  const handleDownloadEncryptedFile = async (item) => {
    try {
      setDownloadingId(item._id);
      const decryptedBlob = await decryptFileFromUrl(
        item.fileData.url,
        item.fileData.mimeType || "application/octet-stream"
      );
      const blobUrl = window.URL.createObjectURL(decryptedBlob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = item.fileData.originalName || "downloaded_file";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert(`Decryption Failed: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

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

  const handleCopy = (item, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
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
      {loading && items.length === 0 && (
        <p className="empty-state">Loading items...</p>
      )}
      {!loading && items.length === 0 && (
        <p className="empty-state">Nothing shared yet. Drop a note or link above.</p>
      )}

      <ul className="feed-list">
        {items.map((item) => {
          const contentToDisplay = decryptedTexts[item._id] || "[Decrypting...]";
          const isLink = item.type === "link";
          const isDecrypted =
            Boolean(decryptedTexts[item._id]) &&
            !contentToDisplay.startsWith("[");
          const expiresT = item.expiresAt
            ? new Date(item.expiresAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "No Expiry";

          return (
            <li key={item._id} className="feed-item">
              <div className="feed-item-top">
                <div className="feed-meta">
                  <strong style={{ color: "var(--text)" }}>
                    {item.senderDeviceId?.name || item.deviceId?.name || "Device"}
                  </strong>
                  <span>•</span>
                  <span className="badge">{item.type}</span>
                  <span>•</span>
                  <span>🔒 E2EE</span>
                  <span>•</span>
                  <span>Exp {expiresT}</span>
                </div>

                <div className="btn-group">
                  {item.type !== "file" && isDecrypted && (
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleCopy(item, contentToDisplay)}
                    >
                      {copiedId === item._id ? "Copied" : "Copy"}
                    </button>
                  )}
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(item._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Text / Link Content */}
              {item.type !== "file" && (
                <div>
                  {isLink && isDecrypted ? (
                    <a
                      className="feed-link"
                      href={
                        contentToDisplay.startsWith("http")
                          ? contentToDisplay
                          : `https://${contentToDisplay}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {contentToDisplay}
                    </a>
                  ) : (
                    <p className="feed-content">{contentToDisplay}</p>
                  )}
                </div>
              )}

              {/* Encrypted File Download Action */}
              {item.fileData && item.fileData.url && (
                <div>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: "0.78rem" }}
                    disabled={downloadingId === item._id}
                    onClick={() => handleDownloadEncryptedFile(item)}
                  >
                    {downloadingId === item._id
                      ? "Decrypting..."
                      : `Download ${item.fileData.originalName || "File"}`}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
