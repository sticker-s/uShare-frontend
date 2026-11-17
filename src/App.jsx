import { useState } from "react";
import { getAuthData, clearAuthData } from "./utils/storage";
import CreateRoom from "./components/CreateRoom";
import JoinRoom from "./components/JoinRoom";
import PairingManager from "./components/PairingManager";
import ShareTextLink from "./components/ShareTextLink";
import ItemFeed from "./components/ItemFeed";

export default function App() {
  const [auth, setAuth] = useState(getAuthData());
  const [view, setView] = useState('create');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshAuth = () => {
    setAuth(getAuthData());
  };

  const handleLogout = () => {
    clearAuthData();
    refreshAuth();
  };

  const triggerFeedRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);

  }
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
          <ShareTextLink onItemShared={triggerFeedRefresh} />
          <hr />
          <ItemFeed refreshTrigger={refreshTrigger} />
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
