import React, { useState } from "react";
import { getAuthData, clearAuthData } from "./utils/storage";
import CreateRoom from "./components/CreateRoom";
import JoinRoom from "./components/JoinRoom";
import PairingManager from "./components/PairingManager";

export default function App() {
    const [auth, setAuth] = useState(getAuthData());
    const [view, setView] = useState('create');

    const refreshAuth = () => {
        setAuth(getAuthData());
    };

    const handleLogout = () => {
        clearAuthData();
        refreshAuth();
    };

    return (
        <div>
            <h1>Ushare 😾</h1>
            {auth.token ? (
                <div>
                    <p>connected to room Id: <strong>{auth.roomId}</strong></p>
                    <p>Device: <strong>{auth.deviceName}({auth.role})</strong></p>
                    <button onClick={handleLogout}>Leave</button>
                    <hr />
                    {auth.role === 'owner' && (
                        <>
                            <PairingManager />
                            <hr />
                        </>
                    )}
                </div>
            ) : (
                <div>
                    <div>
                        <button
                            onClick={() => setView('create')}
                            disabled={view === 'create'}
                        >
                            Create Room
                        </button>
                        <button
                            onClick={() => setView('join')}
                            disabled={view === 'join'}
                        >
                            Join Existing Room
                        </button>
                    </div>
                    <hr />
                    {view === 'create' ? (
                        <CreateRoom onRoomCreated={refreshAuth} />
                    ) : (
                        <JoinRoom onJoined={refreshAuth} />
                    )}
                </div>
            )}
        </div>
    );
}