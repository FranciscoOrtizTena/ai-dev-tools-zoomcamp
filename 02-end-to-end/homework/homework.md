# End-to-End Application Development

In this homework, we'll build an end-to-end application with AI.

You can use any tool you want: ChatGPT, Claude, GitHub Copilot, Codex, Cursor, Antigravity, etc.

With chat-based applications you will need to copy code back-and-forth, so we recommend that you use an AI assistant in your IDE with agent mode.

We will implement a platform for online coding interviews.

The app should be able to do the following:

- Create a link and share it with candidates
- Allow everyone who connects to edit code in the code panel
- Show real-time updates to all connected users
- Support syntax highlighting for multiple languages
- Execute code safely in the browser

You can choose any technologies you want. For example:

- Frontend: React + Vite
- Backend: Express.js

We recommend using JavaScript for frontend, because with other technologies, some of the homework requirements may be difficult to implement.

But you can experiment with alternatives, such as Streamlit.

You don't need to know these technologies for doing this homework.


## Question 1: Initial Implementation

Ask AI to implement both frontend and backend - in one prompt.

Note: you can also follow the same path as in the videos and make it in 3 steps:

1. Frontend
2. OpenAPI specs
3. Backend

What's the initial prompt you gave to AI to start the implementation?

Copy and paste it in the homework form.

```text
Implement an end-to-end online coding interview platform with real-time collaborative editing, shareable room links, syntax highlighting, and safe in-browser code execution**.

### Tech constraints (use exactly these)

* Monorepo with:

  * `frontend/`: React + Vite + TypeScript
  * `backend/`: Node.js + Express + TypeScript
* Real-time: use Socket.IO (server + client)
* Code editor: use Monaco Editor (syntax highlighting)
* Safe execution in the browser:

  * Implement JavaScript execution via a Web Worker sandbox
  * Time-limit execution (e.g., 2s), capture `console.log`, and prevent access to DOM APIs
  * Return stdout + errors back to UI
  * (Do not execute code on the server)

### Functional requirements

1. A user can click “Create interview” and get a shareable link like `/r/<roomId>`.
2. Anyone opening the link joins the same room and can:

   * edit code in the editor collaboratively
   * see live updates in real-time
3. Provide a language selector (at least `javascript`, `python`, `typescript`) that changes editor highlighting.

   * Execution is required only for JavaScript (others can show “coming soon”).
4. Add a “Run” button:

   * Runs code in the Web Worker
   * Shows output panel with captured logs and error messages
5. Keep it simple but working.

### Architecture details

* Backend:

  * `POST /api/rooms` creates a room id and returns it
  * Socket.IO handles:

    * `join-room` (roomId)
    * `code-update` (roomId, code)
    * `language-update` (roomId, language)
  * Maintain room state in memory (no DB).
  * CORS configured for Vite dev server.
* Frontend:

  * Landing page: “Create interview” button.
  * Room page:

    * Monaco editor + language selector
    * output panel + Run button
    * Connect to Socket.IO and synchronize state
  * Debounce edits to avoid flooding.

### Dev experience (must work in Codespaces)

* Provide `package.json` scripts in root and each app.
* Add a "root README" with exact commands to run locally:

  * `npm install`
  * `npm run dev` (runs both frontend+backend concurrently)
* Include a root `docker-compose.yml` (optional, but preferred) to run both services.

### Deliverables

* Create all files and folders.
* Write the code, configs, and minimal styling.
* Make sure it runs without manual patching.
* At the end, summarize:

  * how to start it
  * what URLs to open
  * how to test collaboration (two tabs)
  * how safe execution works

Proceed to generate the full implementation now inside the folder 

02-end-to-end/homework/
```

## Question 2: Integration Tests

Maybe at this point your application will already function. Maybe not. But it's always a good idea to cover it with tests.

We usually do it even before trying to run the application because it helps to resurface all the problems with implementation.

Ask AI to write integration tests that check that the interaction between client and server works.

Also it's a good idea to ask it to start creating a `README.md` file with all the commands for running and testing your application.

What's the terminal command you use for executing tests?

```bash
npm run test
```

## Question 3: Running Both Client and Server

Now let's make it possible to run both client and server at the same time. Use `concurrently` for that.

What's the command you have in `package.json` for `npm dev` for running both?

```bash
concurrently \"npm --prefix backend run dev\" \"npm --prefix frontend run dev\"
```


## Question 4: Syntax Highlighting

Let's now add support for syntax highlighting for JavaScript and Python.

Which library did AI use for it?

```text
Monaco Editor
```

## Question 5: Code Execution

Now let's add code execution.

For security reasons, we don't want to execute code directly on the server. Instead, let's use WASM to execute the code only in the browser.

Which library did AI use for compiling Python to WASM?

```text
Pyodide
```


## Question 6: Containerization

Now let's containerize our application. Ask AI to help you create a Dockerfile for the application. Put both backend and frontend in one container.

What's the base image you used for your Dockerfile?

```text
node:20-alpine
```


## Question 7: Deployment

Now let's deploy it. Choose a service to deploy your application.

Which service did you use for deployment?


## Homework URL

Commit your code to GitHub. You can create a repository for this course. Within the repository, create a folder, e.g. "02-coding-interview", where you put the code.

Use the link to this folder in the homework submission form.

Don't forget to commit your code at every step. You can create an `AGENTS.md` file with the instructions for AI to help you with git commands.


## Tip

You can copy-paste the homework description into the AI system of your choice. But make sure you understand (and follow) all the steps in the response.


## Submission

Submit your homework here: https://courses.datatalks.club/ai-dev-tools-2025/homework/hw2


## Learning in Public

We encourage everyone to share what they learned. 

Don't worry about being perfect. Everyone starts somewhere, and people love following genuine learning journeys!

### Recording a Demo Video

Consider recording a short demo video of your application in action! This makes your post much more engaging and helps others see what you've built.

You can use:
- Screen recording tools like OBS Studio, QuickTime, or Windows Game Bar
- Loom for quick and shareable recording
- Snapping Tool on Windowns
  
Keep it short (30-90 seconds) and show:
- Creating a coding session link
- Multiple users editing code simultaneously
- Real-time updates across browsers
- Code execution in action

Upload your video to LinkedIn, Twitter/X, or YouTube and share the link!

### Example post for LinkedIn:

```
🚀 Week 2 of AI Dev Tools Zoomcamp by @DataTalksClub complete!

Just built a real-time collaborative coding interview platform using AI assistants!

Today I learned how to:

- ✅ Build full-stack applications with AI (frontend + backend)
- ✅ Implement real-time collaboration with WebSockets
- ✅ Add syntax highlighting for multiple languages
- ✅ Execute code safely in the browser with WASM
- ✅ Containerize and deploy the application

Here's my repo: <LINK>
Demo video: <VIDEO_LINK>

Following along with this amazing course - who else is building with AI?

You can sign up here: https://github.com/DataTalksClub/ai-dev-tools-zoomcamp/
```

### Example post for Twitter/X:


```
🤖 Built a collaborative coding platform with AI!

🔗 Shareable links
⚡ Real-time collaboration
🎨 Syntax highlighting
🚀 Browser code execution

My repo: <LINK>
Demo: <VIDEO_LINK>

Join me: https://github.com/DataTalksClub/ai-dev-tools-zoomcamp/
```
