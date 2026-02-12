# Data Benchmark Tool

Compare PitchBook and Harmonic funding data side-by-side for any company. The app proxies API requests through a secure backend function so that API keys are never exposed to the browser.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Supabase Edge Functions (Deno)
- **APIs:** PitchBook Data API, Harmonic API

## Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18 (or [Bun](https://bun.sh/))
- A Supabase project (or Lovable Cloud)
- PitchBook API credentials
- Harmonic API key

## Getting Started

### 1. Clone the repository

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Install dependencies

```sh
npm install
# or
bun install
```

### 3. Configure environment variables

Create a `.env` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-supabase-project-id>
```

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL (found in Project Settings → API) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/public key (found in Project Settings → API) |
| `VITE_SUPABASE_PROJECT_ID` | Your Supabase project ID |

### 4. Configure Supabase secrets

The edge function (`benchmark-proxy`) requires several secrets. Set them via the Supabase CLI or dashboard:

```sh
supabase secrets set APP_PASSWORD="<shared-password-for-app-access>"
supabase secrets set PITCHBOOK_API_KEY_LIVE="<your-pitchbook-live-api-key>"
supabase secrets set PITCHBOOK_API_KEY_SANDBOX="<your-pitchbook-sandbox-api-key>"
supabase secrets set HARMONIC_API_KEY="<your-harmonic-api-key>"
```

| Secret | Required | Description |
|---|---|---|
| `APP_PASSWORD` | ✅ | Shared password that gates access to the app. Users must enter this on the login screen. |
| `PITCHBOOK_API_KEY_LIVE` | ✅ | PitchBook Data API key for production use. Obtain from your PitchBook account. |
| `PITCHBOOK_API_KEY_SANDBOX` | Optional | PitchBook sandbox API key for testing (uses sandbox data, no credit cost). |
| `HARMONIC_API_KEY` | ✅ | Harmonic API key. Obtain from [harmonic.ai](https://harmonic.ai). |

### 5. Update CORS origins

Open `supabase/functions/benchmark-proxy/index.ts` and replace the `ALLOWED_ORIGINS` array with your own deployment domain(s):

```ts
const ALLOWED_ORIGINS = [
  "https://your-app-domain.com",   // your production/preview URL
  "http://localhost:5173",          // local dev
  "http://localhost:8080",          // alternative local dev port
];
```

### 6. Deploy the edge function

```sh
supabase functions deploy benchmark-proxy
```

> **Note:** The function is configured with `verify_jwt = false` in `supabase/config.toml` so it can use the custom shared-password auth instead. This is already set in the repo.

### 7. Start the dev server

```sh
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:5173`.

## Usage

1. Enter the shared password on the login screen.
2. Enter a PitchBook Company ID (e.g. `149504-14`) or paste a full PitchBook profile URL in the search bar.
3. The tool fetches company info and funding rounds from PitchBook, then automatically looks up the same company on Harmonic by domain.
4. A side-by-side comparison table shows funding rounds from both sources, grouped by month.
5. Use the **Copy as Markdown** button to export the table to your clipboard.

## Project Structure

```
src/
├── components/       # UI components (CompanyHeader, ComparisonTable, SearchBar, etc.)
├── integrations/     # Supabase client (auto-generated)
├── lib/              # API helpers, types, utilities
├── pages/            # Page components (Index, NotFound)
└── hooks/            # Custom React hooks

supabase/
└── functions/
    └── benchmark-proxy/   # Edge function that proxies PitchBook & Harmonic API calls
```

## Security Notes

- API keys are stored as Supabase secrets and never exposed to the browser.
- The edge function validates a shared password (`APP_PASSWORD`) on every request.
- All user inputs are validated server-side before being passed to external APIs.
- Error messages returned to the client are sanitized to prevent information leakage.

## ⚠️ Cost Warning

PitchBook API credits are expensive. Each company lookup consumes multiple credits (one for company info, plus one per funding round for deal details). Use sparingly.
