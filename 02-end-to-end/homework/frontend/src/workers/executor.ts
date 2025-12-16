/// <reference lib="webworker" />

export type WorkerRequest = {
  code: string;
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
  const { code } = event.data;
  const { logs, safeConsole } = captureLogs();
  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as (
      ...args: string[]
    ) => (...args: unknown[]) => Promise<unknown>;
    const runner = new AsyncFunction("console", code);
    await runner(safeConsole);
    self.postMessage({ logs } as WorkerResponse);
  } catch (err) {
    self.postMessage({ logs, error: (err as Error).message } as WorkerResponse);
  }
};
