import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client';

export default function ItemFeed({ refreshTrigger }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await apiFetch('/items');
      const list = res.items || res.data || (Array.isArray(res) ? res : []);
      setItems(list);
      setError('');
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
        method: 'DELETE',
      });

      setItems((prev) => prev.filter((item) => item._id !== itemId));
    } catch (err) {
      alert(`Failed to delete:  ${err.message}`);
    }
  };

  return (
    <div>
      <h3>Room Feed ({items.length})</h3>
      <button onClick={fetchItems}>Refresh</button>

      {error && <p>{error}</p>}
      {loading && items.length === 0 && <p>Loading items...</p>}
      {!loading && items.length === 0 && <p>Empty</p>}

      <ul>
        {items.map((item) => {
          const isLink = item.type === 'link';
          const expiresT = item.expiresAt
            ? new Date(item.expiresAt).toLocaleTimeString()
            : 'No Expiry';

          return (
            <li key={item._id} style={{ marginBottom: '1rem' }}>
              <div>
                <small>
                  <strong>{item.deviceId?.name || 'Device'}</strong> |{' '}
                  {item.type.toUpperCase()} | Expires: {expiresT}
                </small>
              </div>

              <div>
                {isLink ? (
                  <a
                    href={
                      item.content.startsWith('http')
                        ? item.content
                        : `https://${item.content}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.content}
                  </a>
                ) : (
                  <p style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
                )}
              </div>

              {item.fileData && item.fileData.url && (
                <div>
                  <a
                    href={item.fileData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download {item.fileData.originalName || 'File'}
                  </a>
                </div>
              )}
              <button onClick={() => handleDelete(item._id)}>Delete</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
