import { useState } from 'react';
import { apiFetch } from '../api/client';

export default function ShareTextLink({ onItemShared }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('text'); // 'text' | 'link'
  const [expiry, setExpiry] = useState('10m'); // '2.10.30m' '1.2.3h' '1.2.3d'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) return;

    setLoading(true);
    try {
      await apiFetch('/items/text-link', {
        method: 'POST',
        body: JSON.stringify({
          type,
          content: content.trim(),
          expiry,
          isEncrypted: false,
        }),
      });

      setContent('');
      if (onItemShared) {
        onItemShared();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Share Text or Link</h3>
      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Type: </label>
          <section value={type} onChange={(e) => setType(e.target.value)}>
            <option value="text">Plain Text / Note</option>
            <option value="link">Web Link / URL</option>
          </section>
        </div>

        <div>
          <label>Expires In: </label>
          <section value={expiry} onChange={(e) => setExpiry(e.target.value)}>
            <option value="2m">2 minutes</option>
            <option value="10m">10 minutes</option>
            <option value="30m">30 minutes</option>
            <option value="1h">1 hour</option>
            <option value="2h">2 hour</option>
            <option value="3h">3 hour</option>
            <option value="1d">1 day</option>
            <option value="2d">2 day</option>
            <option value="3d">3 day</option>
          </section>
        </div>

        <div>
          <textarea
            rows="3"
            cols="40"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              type === 'link' ? 'mspaint.com' : 'text..'
            }
            required
            />
        </div>

        <button type='submit' disabled={loading}>
          {loading ? 'Sharing...' : 'Share to Room'}
        </button>

      </form>
    </div>
  )
}
