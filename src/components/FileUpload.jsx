import { useState, useRef } from "react";
import { apiFetch } from "../api/client";
import { encryptFileBlob } from "../utils/crypto";

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function FileUpload({ onFileUploaded }) {
  const [file, setFile] = useState(null);
  const [expiry, setExpiry] = useState("10m");
  const [status, setStatus] = useState("idle"); // 'idle' | 'signing' | 'uploading' | 'confirming' | 'success'
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const isBusy = status !== "idle" && status !== "success";

  const selectFile = (selected) => {
    if (!selected) return;
    setFile(selected);
    setError("");
    if (status === "success") setStatus("idle");
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      selectFile(e.target.files[0]);
      setError('');
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isBusy) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file first");
      return;
    }
    setError("");

    try {
      setStatus("encrypting");
      const encryptedPayload = await encryptFileBlob(file);

      setStatus("signing");
      const signRes = await apiFetch("/items/upload-signature", {
        method: "POST",
        body: JSON.stringify({
          originalName: file.name,
          size: encryptedPayload.size,
          mimeType: file.type || "application/octet-stream",
          expiry,
          isEncrypted: true,
        }),
      });

      const { itemId, uploadParams } = signRes;
      const params = uploadParams || signRes;

      const {
        uploadUrl,
        signature,
        timestamp,
        apiKey,
        folder,
        publicId,
      } = params;

      setStatus("uploading");
      const formData = new FormData();
      formData.append("file",encryptedPayload, file.name);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", folder);
      formData.append("public_id", publicId);

      const cloudRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!cloudRes.ok) {
        const errorText = await cloudRes.text();
        console.error('Cloudinary upload error:', cloudRes.status, errorText);
        let errorMsg = `Direct cloud upload failed(${cloudRes.status})`;
        try {
          const cloudErr = JSON.parse(errorText);
          errorMsg = cloudErr?.message || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const cloudData = await cloudRes.json();

      setStatus("confirming");
      await apiFetch(`/items/confirm-upload/${itemId}`, {
        method: "POST",
        body: JSON.stringify({
          cloudUrl: cloudData.secure_url,
        }),
      });

      setStatus("success");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (onFileUploaded) {
        onFileUploaded();
      }

      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const buttonLabel = {
    encrypting: "Encrypting...",
    signing: "Preparing upload...",
    uploading: "Uploading...",
    confirming: "Activating file...",
    success: "Uploaded",
    idle: "Upload File",
  }[status];

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Upload File</h3>
          <p className="card-subtitle">Send documents, images, or archives to the room</p>
        </div>
      </div>

      {error && <p className="alert-error">{error}</p>}

      <form onSubmit={handleUpload} className="form-grid">
        <input
          ref={fileInputRef}
          type="file"
          id="ushare-file-input"
          onChange={handleFileChange}
          disabled={isBusy}
          style={{ display: "none" }}
        />

        {!file ? (
          <label
            htmlFor="ushare-file-input"
            className={`file-dropzone ${isDragging ? "dragging" : ""} ${isBusy ? "disabled" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isBusy) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <span className="file-dropzone-title">Click to choose a file or drag & drop</span>
            <span className="file-dropzone-hint">Any file format supported</span>
          </label>
        ) : (
          <div className="file-pill">
            <div className="file-pill-meta">
              <span className="file-pill-name">{file.name}</span>
              <span className="badge mono">{formatFileSize(file.size)}</span>
            </div>
            {!isBusy && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleClearFile}
              >
                Remove
              </button>
            )}
          </div>
        )}

        <div className="field">
          <label htmlFor="file-expiry">Expires In</label>
          <select
            id="file-expiry"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            disabled={isBusy}
          >
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

        <button type="submit" className="btn btn-primary" disabled={isBusy || !file}>
          {buttonLabel}
        </button>
      </form>
    </section>
  );
}
