import Editor from "@monaco-editor/react";
import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";

type ExecutionOutput = {
  logs: string[];
  error?: string;
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "";
const PYODIDE_BASE = import.meta.env.VITE_PYODIDE_URL ?? "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/";

const languages = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
];

const defaultSnippets: Record<string, string> = {
  javascript: "// Start coding together\nconsole.log('Hello!');\n",
  typescript: "// Start coding together\nconst msg: string = 'Hello!';\nconsole.log(msg);\n",
  python: "# Start coding together\nprint('Hello!')\n",
};

function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState("// Syncing room...\n");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState<ExecutionOutput>({ logs: [] });
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const socket = io(SOCKET_URL || undefined, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-room", roomId);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("room-state", (state: { code: string; language: string }) => {
      setLanguage(state.language);
      const incoming = state.code ?? "";
      setCode(incoming === "" ? defaultSnippets[state.language] ?? "" : incoming);
    });

    socket.on("code-update", (newCode: string) => {
      setCode(newCode);
    });

    socket.on("language-update", (newLanguage: string) => {
      setLanguage(() => newLanguage);
      setCode((current) => {
        const placeholders = Object.values(defaultSnippets);
        const shouldReplace = current.trim() === "" || placeholders.includes(current);
        return shouldReplace ? defaultSnippets[newLanguage] ?? current : current;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const shareUrl = useMemo(() => `${window.location.origin}/r/${roomId}`, [roomId]);

  const broadcastCode = (nextCode: string) => {
    if (!socketRef.current || !roomId) return;
    socketRef.current.emit("code-update", { roomId, code: nextCode });
  };

  const handleCodeChange = (value?: string) => {
    if (typeof value !== "string") return;
    setCode(value);
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => broadcastCode(value), 250);
  };

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    setLanguage(next);

    setCode((current) => {
      const placeholders = Object.values(defaultSnippets);
      const shouldReplace = current.trim() === "" || placeholders.includes(current);
      const nextSnippet = defaultSnippets[next] ?? current;
      if (shouldReplace && nextSnippet !== current) {
        broadcastCode(nextSnippet);
        return nextSnippet;
      }
      return current;
    });

    if (socketRef.current && roomId) {
      socketRef.current.emit("language-update", { roomId, language: next });
    }
  };

  const runCode = () => {
    if (language === "typescript") {
      setOutput({
        logs: [],
        error: "Execution for TypeScript not yet available. Try JavaScript or Python.",
      });
      return;
    }
    const worker = new Worker(new URL("../workers/executor.ts", import.meta.url));
    let finished = false;
    const timeout = window.setTimeout(() => {
      if (!finished) {
        worker.terminate();
        setOutput({ logs: [], error: "Execution timed out (2s)." });
      }
    }, 2000);

    worker.onmessage = (event: MessageEvent<ExecutionOutput>) => {
      finished = true;
      window.clearTimeout(timeout);
      setOutput(event.data);
      worker.terminate();
    };

    worker.onerror = (event) => {
      finished = true;
      window.clearTimeout(timeout);
      setOutput({
        logs: [],
        error: event.message || "Execution failed inside sandbox.",
      });
      worker.terminate();
    };

    worker.postMessage({ code, language, pyodideBase: PYODIDE_BASE });
  };

  const leaveRoom = () => navigate("/");

  return (
    <div className="container">
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: "0 0 6px" }}>Room {roomId}</h2>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
            Share link: <code>{shareUrl}</code>
          </p>
        </div>
        <div className="spacer" />
        <span
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            background: connected ? "#22c55e33" : "#ef444433",
            color: connected ? "#22c55e" : "#f97316",
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {connected ? "Connected" : "Reconnecting..."}
        </span>
        <button className="btn" onClick={leaveRoom} style={{ marginLeft: 10 }}>
          Exit
        </button>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 10 }}>
          <label style={{ color: "#cbd5e1", fontSize: 14 }}>Language</label>
          <select
            value={language}
            onChange={handleLanguageChange}
            style={{
              background: "#0f172a",
              color: "#e2e8f0",
              borderRadius: 8,
              padding: "8px 10px",
              border: "1px solid #1e293b",
              marginLeft: 8,
            }}
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          <div className="spacer" />
          <button className="btn" onClick={runCode}>
            Run
          </button>
        </div>
        <Editor
          height="60vh"
          defaultLanguage="javascript"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
        <div style={{ marginTop: 14 }}>
          <p style={{ margin: "6px 0", color: "#cbd5e1", fontWeight: 700 }}>
            Output
          </p>
          <div
            style={{
              background: "#0b1220",
              border: "1px solid #1e293b",
              borderRadius: 10,
              minHeight: 80,
              padding: "10px 12px",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
            }}
          >
            {output.error && <div style={{ color: "#f97316" }}>{output.error}</div>}
            {output.logs.length === 0 && !output.error && (
              <span style={{ color: "#64748b" }}>No output yet</span>
            )}
            {output.logs.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Room;
