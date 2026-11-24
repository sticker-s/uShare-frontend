import { useState } from "react";
import { apiFetch } from "../api/client";
import { saveAuthData, saveRoomKey } from "../utils/storage";
import { generateRandomRoomKey } from "../utils/crypto"

export default function CreateRoom({ onRoomCreated }) {
  const [roomName, setRoomName] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("/rooms/create", {
        method: "POST",
        body: JSON.stringify({ roomName, deviceName }),
      });

      const autoRoomKey = generateRandomRoomKey();
      saveRoomKey(autoRoomKey);
      saveAuthData(res.rawToken, res.roomId, res.ownerDevice.name, res.ownerDevice.role);

      if (onRoomCreated) {
        onRoomCreated();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <h2 className="card-title">Create a New Room</h2>
        <p className="card-subtitle">Start a private space to drop text and links across devices.</p>
      </div>

      {error && <p className="alert-error">{error}</p>}

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="field">
          <label htmlFor="room-name">Room Name</label>
          <input
            id="room-name"
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g. My Workspace"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="creator-device">Your Device Name</label>
          <input
            id="creator-device"
            type="text"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder="e.g. Main Laptop"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Creating..." : "Create Room"}
        </button>
      </form>
    </div>
  );
}
