/// <reference lib="webworker" />

export type WorkerRequest = {
  code: string;
  language: "javascript" | "python" | string;
  pyodideBase?: string;
};

export type WorkerResponse = {
  logs: string[];
  error?: string;
};

const captureLogs = () => {
  const logs: string[] = [];
  const safeConsole = {
    log: (...args: unknown[]) => {
      logs.push(args.map((item) => String(item)).join(" "));
    },
  };
  return { logs, safeConsole };
};

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { code, language, pyodideBase } = event.data;
  const { logs, safeConsole } = captureLogs();
  try {
    if (language === "python") {
      await runPython(code, logs, pyodideBase);
    } else {
      await runJavaScript(code, safeConsole);
    }
    self.postMessage({ logs } satisfies WorkerResponse);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Execution error";
    self.postMessage({ logs, error: message } satisfies WorkerResponse);
  }
};

type AsyncFunctionConstructor = new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

const runJavaScript = async (code: string, safeConsole: { log: (...args: unknown[]) => void }) => {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as AsyncFunctionConstructor;
  const runner = new AsyncFunction("console", code);
  await runner(safeConsole);
};

let pyodideReady: Promise<any> | null = null;

const loadPyodideOnce = async (baseUrl: string) => {
  if (!pyodideReady) {
    // Classic worker + importScripts so Pyodide can load.
    pyodideReady = (async () => {
      const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
      importScripts(`${base}pyodide.js`);
      // @ts-ignore loadPyodide is injected by the script above
      return self.loadPyodide({
        indexURL: base,
      });
    })();
  }
  return pyodideReady;
};

const runPython = async (code: string, logs: string[], baseUrl?: string) => {
  const base = baseUrl ?? "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/";
  const pyodide = await loadPyodideOnce(base);
  await pyodide.runPythonAsync(`
import sys, io
_orig_stdout = sys.stdout
_orig_stderr = sys.stderr
_buffer = io.StringIO()
sys.stdout = _buffer
sys.stderr = _buffer
`);
  try {
    await pyodide.runPythonAsync(code);
  } finally {
    const captured = await pyodide.runPythonAsync("_buffer.getvalue()");
    if (captured) {
      captured
        .toString()
        .split(/\\r?\\n/)
        .filter(Boolean)
        .forEach((line: string) => logs.push(line));
    }
    await pyodide.runPythonAsync(`
sys.stdout = _orig_stdout
sys.stderr = _orig_stderr
`);
  }
};
