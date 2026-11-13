# Gemini Chat – AI Assistant

[![React 19](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%2F%207.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-2.5--flash-4285F4?logo=google&logoColor=white)](https://aistudio.google.com/)
[![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com/)

A modern, distraction-free conversational AI workspace powered by **Google Gemini** language models via the official `@google/genai` SDK, with persistent storage and authentication managed by **Supabase PostgreSQL** (secured with Row Level Security), and deployed seamlessly on **Vercel**.

Designed with the conversational usability of ChatGPT, the typography and minimalism of Claude, and the visual polish of Google Gemini.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   Frontend (Vite SPA)                  │
│  React 19 • TypeScript • Tailwind CSS • shadcn/ui      │
│  Framer Motion • React Router • Lucide React          │
│  Supabase Client (Auth + Client-side queries with RLS) │
└───────────────────────┬────────────────────────────────┘
                        │ HTTPS / Server-Sent Events (SSE)
                        ▼
┌────────────────────────────────────────────────────────┐
│             Backend API (Vercel Functions)             │
│  /api/chat            - Stream response & persist      │
│  /api/chat/regenerate - Context re-evaluation & stream │
│  /api/conversations   - Title updates & management     │
│  /api/messages        - Branching / edit & resend      │
│  Supabase Server SDK  - Auth token verification        │
│  Google Gen AI SDK    - @google/genai streaming        │
└───────────┬────────────────────────────────┬───────────┘
            │ Token verification             │ Streaming AI
            ▼                                ▼
┌───────────────────────┐        ┌───────────────────────┐
│       Supabase        │        │   Google Gemini API   │
│  PostgreSQL with RLS  │        │   gemini-2.5-flash /  │
│  Auth (Email + OAuth) │        │   configurable model  │
└───────────────────────┘        └───────────────────────┘
```

---

## Key Features

- **Real-Time Streaming AI**: Powered by Google's official `@google/genai` SDK using Server-Sent Events (SSE).
- **Persistent Conversation Management**: All conversations and messages are persisted in Supabase PostgreSQL with cascading deletes and chronological sorting.
- **Strict Row Level Security (RLS)**: Enforced directly in PostgreSQL so users can never access or modify another user's data.
- **Authentication**:
  - Email and password registration & login.
  - Google OAuth single-click authentication.
  - Persistent sessions across reloads with protected routes.
- **Rich Markdown & Code Highlighting**:
  - Headings, lists, blockquotes, tables, and inline code.
  - Syntax-highlighted code blocks with language badge and copy-to-clipboard button.
  - Safe protocol validation for links to prevent XSS.
- **Advanced Chat Interaction Controls**:
  - **Copy Response**: Copy assistant responses to clipboard with temporary confirmation.
  - **Stop Generation**: Abort in-flight streaming responses immediately; preserves partial generated text with an `interrupted` badge.
  - **Regenerate Response**: Re-run the preceding context through Gemini to generate a fresh answer.
  - **Edit & Resend**: Edit earlier user prompts in-place; automatically truncates downstream conversation branches to maintain context integrity.
- **Deterministic Conversation Titles**: Generates clean, instant titles from the user's initial message without costly extra AI API calls.
- **Light, Dark, and System Themes**: High-contrast, accessibility-first theme engine with persistent local storage.
- **Responsive Mobile Layout**: Fixed desktop collapsible sidebar that transforms into a smooth touch slide-out drawer on mobile viewports.

---

## Project Structure

```
gemini-chat/
├── api/                             # Vercel Serverless Functions
│   ├── _lib/
│   │   ├── gemini.ts                # Server-side @google/genai client & context formatter
│   │   ├── gemini.test.ts           # Context formatting test suite
│   │   └── supabaseServer.ts        # Server-side JWT authentication & RLS checks
│   ├── chat.ts                      # POST /api/chat - SSE streaming endpoint
│   ├── chat/
│   │   └── regenerate.ts            # POST /api/chat/regenerate - Regeneration endpoint
│   ├── conversations/
│   │   └── [id].ts                  # PATCH / DELETE conversation
│   └── messages/
│       └── [id].ts                  # PATCH message / truncate downstream
├── public/
│   └── favicon.svg                  # Brand SVG favicon
├── src/
│   ├── components/
│   │   ├── auth/                    # AuthForm, ProtectedRoute
│   │   ├── chat/                    # ChatWorkspace, ChatMessage, MessageComposer,
│   │   │                            # MarkdownRenderer, CodeBlock, StreamingIndicator, WelcomeScreen
│   │   ├── conversation/            # RenameDialog, DeleteDialog
│   │   ├── layout/                  # AppLayout, Header
│   │   ├── sidebar/                 # Sidebar, MobileSidebar, ConversationItem
│   │   └── ui/                      # Button, Input, Dialog, ThemeToggle
│   ├── contexts/
│   │   ├── AuthContext.tsx          # Supabase auth state & session listener
│   │   └── ThemeContext.tsx         # Light / Dark / System theme management
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useChat.ts               # Streaming, stop, regenerate, edit & resend
│   │   ├── useConversations.ts      # Conversation list, titles, CRUD
│   │   └── useTheme.ts
│   ├── pages/
│   │   ├── ChatPage.tsx             # Main chat workspace view
│   │   ├── LoginPage.tsx            # Sign in view
│   │   └── SignupPage.tsx           # Sign up view
│   ├── services/
│   │   ├── chat/chatApi.ts          # Frontend SSE streaming client with AbortController
│   │   └── supabase/
│   │       ├── client.ts            # Supabase JS client configuration
│   │       └── database.ts          # Database CRUD operations with fallback
│   ├── styles/
│   │   └── globals.css              # Tailwind directives & CSS design tokens
│   ├── types/                       # Shared TypeScript interfaces (chat, conversation, user)
│   ├── utils/
│   │   ├── cn.ts                    # Class name merge utility
│   │   └── formatting.ts            # Deterministic title generator & timestamps
│   ├── App.tsx                      # React Router configuration
│   └── main.tsx                     # React entrypoint
├── supabase/
│   └── migrations/
│       └── 20260101000000_initial_schema.sql  # Complete PostgreSQL schema & RLS policies
├── .env.example                     # Environment template
├── vercel.json                      # Vercel deployment configuration
├── vite.config.ts                   # Vite configuration with local streaming API middleware
└── package.json
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended).
- **pnpm**: v9.0.0 or higher (or npm / yarn).

### 2. Clone and Install Dependencies
```bash
git clone <repository-url>
cd gemini-chat
pnpm install
```

### 3. Environment Variables Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:

```ini
# Supabase Configuration (Frontend - public)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Serverless Configuration (Backend - private, never prefix with VITE_)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=

# Google Gemini API (Get key from https://aistudio.google.com/)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

---

## Supabase Database Setup

1. Create a new project in [Supabase](https://supabase.com/).
2. Navigate to the **SQL Editor** in your Supabase dashboard.
3. Open `supabase/migrations/20260101000000_initial_schema.sql` from this repository.
4. Paste the SQL contents into the SQL Editor and click **Run**.

This migration script will:
- Create `public.profiles`, `public.conversations`, and `public.messages` tables.
- Establish foreign keys with `ON DELETE CASCADE`.
- Create performance indexes on `user_id`, `conversation_id`, and timestamps.
- Enable **Row Level Security (RLS)** on all tables with strict user ownership policies.
- Create an automated trigger that populates `public.profiles` whenever a user registers in `auth.users`.

### Optional: Google OAuth Configuration in Supabase
1. In the Supabase Dashboard, go to **Authentication** > **Providers** > **Google**.
2. Toggle Google to **Enabled**.
3. Add your **Client ID** and **Client Secret** from the [Google Cloud Console](https://console.cloud.google.com/).
4. In Google Cloud Console, add your Supabase redirect URI (found under the Google provider settings in Supabase) to the **Authorized redirect URIs**.

---

## Local Development

Start the development server:
```bash
pnpm dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Local API Parity**: During `pnpm dev`, Vite uses an embedded development server middleware configured in `vite.config.ts`. It catches `/api/chat` and `/api/chat/regenerate` requests, reads `GEMINI_API_KEY` from `.env`, and streams SSE tokens live to the frontend. No secondary backend server process is required during development!

---

## Running Tests & Type Checks

Run the automated Vitest test suite:
```bash
pnpm test
```

Run TypeScript verification and production build:
```bash
pnpm run build
```

---

## Vercel Deployment

The application is pre-configured for one-click deployment on **Vercel** via `vercel.json`.

### Option A: Deploy via GitHub Integration
1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/), click **Add New** > **Project** and select your repository.
3. In the project settings, configure the **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (e.g. `gemini-2.5-flash`)
4. Click **Deploy**.

### Option B: Deploy via Vercel CLI
```bash
pnpm add -g vercel
vercel
```
Follow the interactive prompts, and add the environment variables in the Vercel project dashboard.

### Post-Deployment: Configure Supabase Auth URLs
In your Supabase project:
1. Go to **Authentication** > **URL Configuration**.
2. Set **Site URL** to your Vercel production URL (e.g., `https://your-app.vercel.app`).
3. Add your Vercel deployment URLs to **Redirect URLs**.

---

## Security Highlights

- **Server-Side API Key Isolation**: `GEMINI_API_KEY` is exclusively read by backend serverless functions in `/api/` and is never exposed to the client bundle.
- **Row Level Security (RLS)**: Enforced at the PostgreSQL engine level. Frontend requests directly to Supabase can only access rows matching `auth.uid() = user_id`.
- **Server Authorization**: API endpoints verify the caller's Supabase JWT token before querying Gemini or writing messages.
- **Markdown Sanitization**: Links are strictly validated against safe protocols (`http:`, `https:`, `mailto:`) to prevent `javascript:` XSS vectors. Unsafe raw HTML execution is disabled.
- **Branch Truncation**: When a user edits a previously submitted prompt, downstream assistant and user turns are deleted to prevent stale context corruption.

---

## License
MIT
