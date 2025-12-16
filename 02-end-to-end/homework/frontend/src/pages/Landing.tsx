import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL ?? "";

function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = async () => {
    setLoading(true);
    setError(null);
    try {
      const base = API_URL || "";
      const res = await fetch(`${base}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error("Failed to create room");
      }
      const data = (await res.json()) as { roomId: string };
      navigate(`/r/${data.roomId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ textAlign: "center", marginTop: 80 }}>
        <h1 style={{ marginBottom: 10 }}>Live Coding Interview</h1>
        <p style={{ color: "#94a3b8", marginTop: 0 }}>
          Spin up a collaborative room, share the link, and pair on code with
          real-time updates.
        </p>
        <button className="btn" data-testid="create-btn" onClick={createRoom} disabled={loading}>
          {loading ? "Creating..." : "Create interview"}
        </button>
        {error && <p style={{ color: "#f97316" }}>{error}</p>}
      </div>
    </div>
  );
}

export default Landing;
