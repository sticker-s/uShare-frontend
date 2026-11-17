import { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

export default function PairingManager() {
  const [activeCode, setActiveCode] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateCode = async () => {
    setError('');
    setLoading(true)
    try {
      const res = await apiFetch('/pairing/generate-code', {
        method: 'POST',
      });
      setActiveCode(res.code);
      setExpiresAt(new Date(Date.now() + res.expiresInSeconds * 1000));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await apiFetch('/pairing/requests');
      setPendingRequests(res.requests || []);
    } catch (err) {
      // ignoring it for now
    }
  };

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRespond = async (requestId, decision) => {
    setError('');
    try {
      await apiFetch(`/pairing/respond/${requestId}`, {
          method: 'POST',
          body: JSON.stringify({ action: decision }),
      });
      fetchPending();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h3>Pairing & Device Access (Owner Controls)</h3>
      {error && <p>{error}</p>}

      <div>
        <button onClick={handleGenerateCode} disabled={loading}>
          {loading ? 'Generating...' : 'Generate 6-Digit Pairing Code'}
        </button>
        {activeCode && (
          <div>
            <p>
              Pairing Code: <strong>{activeCode}</strong>
            </p>
            <p>
              Expires around:{' '}
              {expiresAt ? expiresAt.toLocaleTimeString() : ''}
            </p>
          </div>
        )}
      </div>
      <div>
        <h4>Pending Requests ({pendingRequests.length})</h4>
        {pendingRequests.length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          <ul>
            {pendingRequests.map((req) => (
              <li key={req._id}>
                <span>
                  <strong>{req.deviceName}</strong> (Requested at:{' '}
                  {new Date(req.createdAt).toLocaleTimeString()})
                </span>
                {' '}
                <button onClick={() => handleRespond(req._id, 'approve')} >
                  Approve
                </button>
                {' '}
                <button onClick={() => handleRespond(req._id, 'reject')} >
                  Reject
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
