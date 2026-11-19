import { useState, useEffect } from "react";
import { getAuthData, clearAuthData } from "./utils/storage";
import CreateRoom from "./components/CreateRoom";
import JoinRoom from "./components/JoinRoom";
import PairingManager from "./components/PairingManager";
import ShareTextLink from "./components/ShareTextLink";
import ItemFeed from "./components/ItemFeed";
import FileUpload from "./components/FileUpload";

const THEMES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "sepia", label: "Sepia" },
  { id: "midnight", label: "Midnight" },
];

export default function App() {
  const [auth, setAuth] = useState(getAuthData());
  const [view, setView] = useState('create');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem("ushare_theme") || "light");

  useEffect(() => {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("ushare_theme", theme);
    }, [theme]);

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
      <div className="app-shell">
        <header className="app-header">
          <div className="brand">
            <span>Ushare</span>
            <span role="img" aria-label="cat">😾</span>
          </div>

          <div className="theme-switcher" role="group" aria-label="Theme mode">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`theme-btn ${theme === t.id ? "active" : ""}`}
                onClick={() => setTheme(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </header>

        {auth.token ? (
          <main className="stack">
            <section className="card room-bar">
              <div className="room-meta">
                <div className="room-id-row">
                  <span className="status-dot" />
                  <span style={{ color: "var(--text-muted)" }}>Room</span>
                  <strong className="mono">{auth.roomId}</strong>
                </div>
                <div className="room-id-row">
                  <span style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
                    {auth.deviceName}
                  </span>
                  <span className="badge">{auth.role}</span>
                </div>
              </div>

              <button className="btn btn-danger" onClick={handleLogout}>
                Leave Room
              </button>
            </section>

            {auth.role === "owner" && <PairingManager />}

            <ShareTextLink onItemShared={triggerFeedRefresh} />

            <FileUpload onFileUploaded={triggerFeedRefresh} />

            <ItemFeed refreshTrigger={refreshTrigger} />
          </main>
        ) : (
          <main className="card">
            <div className="tabs">
              <button
                type="button"
                className={`tab-btn ${view === "create" ? "active" : ""}`}
                onClick={() => setView("create")}
              >
                Create Room
              </button>
              <button
                type="button"
                className={`tab-btn ${view === "join" ? "active" : ""}`}
                onClick={() => setView("join")}
              >
                Join Existing Room
              </button>
            </div>

            {view === "create" ? (
              <CreateRoom onRoomCreated={refreshAuth} />
            ) : (
              <JoinRoom onJoined={refreshAuth} />
            )}
          </main>
        )}
      </div>
    );
}
