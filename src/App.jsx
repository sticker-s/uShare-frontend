import React, { useState } from "react";
import { getAuthData, clearAuthData } from "./utils/storage";
import CreateRoom from "./components/CreateRoom";

export default function App() {
    const [auth, setAuth] = useState(getAuthData());

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
                </div>
            ) : (
                <CreateRoom onRoomCreated={refreshAuth} />
            )}
        </div>
    );
}