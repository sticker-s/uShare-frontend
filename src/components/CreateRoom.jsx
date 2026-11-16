import { useState } from "react";
import { apiFetch } from "../api/client";
import { saveAuthData } from "../utils/storage";

export default function CreateRoom({ onRoomCreated }) {
    const [roomName, setRoomName] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await apiFetch('/rooms/create', {
                method: 'POST',
                body: JSON.stringify({ roomName, deviceName }),
            });

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

            <h2>create a new room</h2>
            {error && <p style={{ color: 'red' }}> {error} </p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Room Name: </label>
                    <input type="text"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="e.g My washroom"
                        required />
                </div>
                <div>
                    <label>Your Device Name: </label>
                    <input
                        type="text"
                        value={deviceName}
                        onChange={(e) => setDeviceName(e.target.value)}
                        placeholder="e.g. Main Laptop"
                        required
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Room'}
                </button>

            </form>
        </div>
    )

}
