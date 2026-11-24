import { useCallback, useState, useEffect } from "react";
import { clearAuthData, getAuthData } from "../utils/storage";
import { apiFetch } from "../api/client";

export default function DeviceList({ onDeviceKicked }) {
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [kickingId, setKickingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const auth = getAuthData();
  const isOwner = auth.role === "owner";

  const fetchDevices = useCallback(async () => {
    try {
      const res = await apiFetch("/devices");
      const list = res.devices || [];
      setDevices(list);
      setError("");
    } catch (err) {
      if (
        err.message.includes("401") ||
        err.message.includes("403") ||
        err.message.toLowerCase().includes("unauthorized")
      ) {
        clearAuthData();
        window.location.reload();
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  useEffect(() => {
    if (!confirmingId) return;
    const timer = setTimeout(() => {
      setConfirmingId(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [confirmingId]);

  const handleKickAction = async (deviceId) => {
    if (confirmingId !== deviceId) {
      setConfirmingId(deviceId);
      setError("");
      return;
    }

    setConfirmingId(null);
    setKickingId(deviceId);

    try {
      await apiFetch(`/devices/${deviceId}`, {
        method: "DELETE",
      });

      setRemovingId(deviceId);
      setTimeout(() => {
        setDevices((prev) => prev.filter((d) => d._id !== deviceId));
        setRemovingId(null);
        setKickingId(null);
        if (onDeviceKicked) {
          onDeviceKicked();
        }
      }, 240);
    } catch (err) {
      setKickingId(null);
      setError(`Failed to remove device: ${err.message}`);
    }
  };

  return (
    <section className="card">
      <div className="card-header">
        <div className="device-header-title">
          <h3 className="card-title">Connected Devices</h3>
          <span className="badge">{devices.length}</span>
        </div>
        <button type="button" className="btn btn-ghost" onClick={fetchDevices}>
          Refresh
        </button>
      </div>

      {error && <p className="alert-error">{error}</p>}
      {loading && devices.length === 0 && (
        <p className="empty-state">Loading devices...</p>
      )}
      {!loading && devices.length === 0 && !error && (
        <p className="empty-state">No devices connected.</p>
      )}

      {devices.length > 0 && (
        <ul className="request-list">
          {devices.map((d) => {
            const isSelf = d.name === auth.deviceName;
            const canKick = isOwner && !isSelf && d.role !== "owner";
            const isArmed = confirmingId === d._id;
            const isKicking = kickingId === d._id;
            const isRemoving = removingId === d._id;

            return (
              <li
                key={d._id}
                className={`request-item device-row ${isRemoving ? "removing" : ""}`}
              >
                <div className="device-info">
                  <div className="device-name-row">
                    <span className="status-dot" />
                    <span className="device-name">{d.name}</span>
                  </div>
                  <div className="device-badges">
                    <span className="badge">{d.role}</span>
                    {isSelf && <span className="badge badge-self">This Device</span>}
                  </div>
                </div>

                {canKick && (
                  <div className="kick-controls">
                    {isArmed && !isKicking && (
                      <button
                        type="button"
                        className="btn btn-ghost cancel-arm-btn"
                        onClick={() => setConfirmingId(null)}
                        aria-label="Cancel removal"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isKicking}
                      className={`btn btn-danger kick-btn ${isArmed ? "armed" : ""}`}
                      onClick={() => handleKickAction(d._id)}
                    >
                      {isKicking
                        ? "Removing..."
                        : isArmed
                        ? "Confirm?"
                        : "Excommunicado"}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
