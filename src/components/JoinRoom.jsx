import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "../api/client";
import { saveAuthData } from "../utils/storage";

export default function JoinRoom({ onJoined, onCancel }) {
    const [pairingCode, setPairingCode] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState('idle');
    const [requestId, setRequestId] = useState(null);

    const pollingRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setStatus('waiting');

        try {
            const res = await apiFetch('/pairing/request', {
                method: 'POST',
                body: JSON.stringify({
                    code: pairingCode.trim(),
                    deviceName: deviceName.trim(),
                }),
            });
            setRequestId(res.requestId);
        } catch (error) {
            setError(error.message);
            setStatus('idle');
        }
    };

    useEffect(() => {
        if (!requestId || status !== 'waiting') return;

        pollingRef.current = setInterval(async () => {
            try {
                const res = await apiFetch(`/pairing/status/${requestId}`);

                if (res.status === 'approved') {
                    clearInterval(pollingRef.current);
                    setStatus('approved');
                    saveAuthData(res.token, res.roomId, res.device.name, res.device.role);
                    if (onJoined) onJoined();
                } else if (res.status === 'rejected') {
                    clearInterval(pollingRef.current);
                    setStatus('rejected');
                    setError('Not welcomed !');
                }
            } catch (error) {
                clearInterval(pollingRef.current);
                setError(error.message);
                setStatus('idle');
            }
        }, 2000);
        return () => clearInterval(pollingRef.current);
    }, [requestId, status, onJoined]);

    return (
        <div>
            <h2>Join an Exisitng Room</h2>
            {error && <p >{error}</p>}

            {status === 'idle' && (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>6-Digit Pairing Code: </label>
                        <input type="text"
                            maxLength="6"
                            value={pairingCode}
                            onChange={(e) => setPairingCode(e.target.value)}
                            placeholder="e.g. 123456"
                            required
                        />
                    </div>
                    <div>
                        <label> Your Device Name: </label>
                        <input type="text"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            placeholder="John Wick's Car's Ipad"
                            required />
                    </div>
                    <button type="submit">Submit Request</button>
                    {onCancel && (
                        <button type="button" onClick={onCancel}>
                            Back
                        </button>
                    )}
                </form>
            )}
            {status === 'waiting' && (
                <div>
                    <p>Request sent! Waiting for room owner to approve...</p>
                    <button
                        type="button"
                        onClick={() => {
                            clearInterval(pollingRef.current);
                            setStatus('idle');
                            setRequestId(null);
                        }}
                    >
                        Cancel
                    </button>
                </div>
            )}

            {status === 'rejected' && (
                <button
                    type="button"
                    onClick={() => {
                        setStatus('idle');
                        setRequestId(null);
                        setError('');
                    }}
                >
                    Try Again
                </button>
            )}
        </div>
    );
}
