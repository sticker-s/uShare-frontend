import { useCallback, useState } from "react";
import { clearAuthData, getAuthData } from '../utils/storage';
import { apiFetch } from '../api/client';
import { useEffect } from "react";

export default function DeviceList({ onDeviceKicked }) {
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const auth = getAuthData();
  const isOwner = auth.role === 'owner';

  const fetchDevices = useCallback(async () => {
    try {
      const res = await apiFetch('/devices');
      const list = res.devices;
      setDevices(list);
      setError('');
    } catch (err) {
      // for kicked users
      if (err.message.includes('401') || err.message.includes('403') || err.message.toLowerCase().includes('unauthorized')) {
        alert('Excommunicado');
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

  const handleKick = async (deviceId, deviceName) => {
    const confirmKick = window.confirm(`sure to kick ${deviceName} ?`);
    if (!confirmKick) return;

    try {
      await apiFetch(`/devices/${deviceId}`, {
        method: 'DELETE',
      });

      setDevices((prev) => prev.filter((d) => d._id !== deviceId));
      if (onDeviceKicked) {
        onDeviceKicked();
      }
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  return (
    <div>
      <h3>Connected Devices</h3>
      {error && <p>{error}</p>}
      {loading && devices.length === 0 && <p>Loading devices ...</p>}

      <ul>
        {devices.map((d) => {
          const isSelf = d.name === auth.deviceName;
          const canKick = isOwner && !isSelf && d.role !== 'owner';

          return (
            <li key={d._id} style={{ marginBottom: '0.5rem' }}>
              <span>
                <strong>{d.name} </strong> ({d.role})
                {isSelf && <em> - (This Device</em>}
              </span>
              {' '}
              {canKick && (
                <button onClick={() => handleKick(d._id, d.name)}>
                  Excommunicado
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
