import { test, expect, Page, Browser } from "@playwright/test";

const API_BASE = "http://localhost:4000";

const getEditor = (page: Page) => page.locator(".monaco-editor").first();
const getEditorView = (page: Page) => page.locator(".view-lines");

const setMonacoCode = async (page: Page, code: string) => {
  await getEditor(page).waitFor();
  await page.evaluate((value) => {
    const anyWindow = window as any;
    const monaco = anyWindow.monaco;
    if (monaco?.editor?.getModels().length) {
      monaco.editor.getModels()[0].setValue(value);
    }
  }, code);
};

test("room creation via UI navigates to room with id", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("create-btn").click();
  await expect(page).toHaveURL(/\/r\/[a-z0-9]{8}$/i);
});

test("real-time collaboration syncs code between two pages", async ({ browser, request }) => {
  const roomId = await createRoom(request);
  const roomPath = `/r/${roomId}`;

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  await Promise.all([pageA.goto(roomPath), pageB.goto(roomPath)]);
  await Promise.all([getEditor(pageA).waitFor(), getEditor(pageB).waitFor()]);

  await setMonacoCode(pageA, "console.log('synced!')");
  await expect(getEditorView(pageA)).toContainText("synced!");
  await expect(getEditorView(pageB)).toContainText("synced!");

  await contextA.close();
  await contextB.close();
});

test("run button executes JavaScript and shows output", async ({ page, request }) => {
  const roomId = await createRoom(request);
  const roomPath = `/r/${roomId}`;
  await page.goto(roomPath);
  await getEditor(page).waitFor();

  await setMonacoCode(page, "console.log('hi')");
  await expect(getEditorView(page)).toContainText("console.log('hi')");

  await page.getByTestId("run-btn").click();
  const output = page.getByTestId("output-panel");
  await expect(output).toContainText("hi");
});

test("infinite loop times out", async ({ page, request }) => {
  const roomId = await createRoom(request);
  const roomPath = `/r/${roomId}`;
  await page.goto(roomPath);
  await getEditor(page).waitFor();

  await setMonacoCode(page, "while (true) {}");
  await expect(getEditorView(page)).toContainText("while (true)");

  await page.getByTestId("run-btn").click();
  const output = page.getByTestId("output-panel");
  await expect(output).toContainText(/timed out/i);
});

async function createRoom(request: any): Promise<string> {
  const res = await request.post(`${API_BASE}/api/rooms`);
  const data = await res.json();
  return data.roomId as string;
}
