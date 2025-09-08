# FilteredFeedback - Anonymous Feedback Platform

An anonymous feedback platform that filters mean comments using AI and encrypts all feedback with end-to-end encryption.

## Features

- 🔒 **End-to-End Encryption**: Feedback is encrypted with your public key; your password only protects your private key if you save it locally
- 🤖 **AI Filtering**: Automatically filters potentially hurtful comments into a separate folder
- 👤 **Complete Anonymity**: No tracking of feedback senders
<!-- Removed: Provable Privacy endpoints -->
- 📧 **Email Notifications**: Get notified when you receive new feedback
- 🎨 **Custom Filters**: Customize how strict the AI filtering should be

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- OpenRouter API key (optional, for AI filtering)
- Postmark API key (optional, for email notifications)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/FilteredFeedback.git
cd FilteredFeedback
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API and copy your project URL and anon key
3. Go to SQL Editor and run the schema from `supabase/schema.sql`
4. Configure Passwordless (Magic Links)
   - Go to Authentication → Email, enable Magic Links
   - Set Site URL to http://localhost:3000
   - Add `http://localhost:3000/auth/callback` to the redirect URL allowlist
   - (Optional) Configure a custom SMTP sender for production

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Server-side key used to encrypt API keys at rest (must be 32 bytes, base64-encoded)
KEY_ENCRYPTION_KEY=base64-32-byte-secret

# App URL (used for links in emails and OpenRouter referer)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: OpenRouter for AI filtering
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional: Postmark for email notifications
POSTMARK_API_KEY=your_postmark_api_key
POSTMARK_FROM_EMAIL=noreply@yourdomain.com
POSTMARK_MESSAGE_STREAM=outbound

# Optional: Extra salt used in client-side key derivation (any random string)
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How It Works

1. **Sign In**: Users request a passwordless magic link; we generate a key pair in the browser and store only your public key. You can optionally set a password to encrypt and save your private key locally.
2. **Share Link**: Get a unique link like `app.com/f/username` (default). If rotated, your link becomes a secure token URL.
3. **Submit Feedback**: Anyone can submit anonymous feedback through your link
4. **AI Filtering**: Feedback is analyzed by AI to detect mean comments
5. **Encryption**: All feedback is immediately encrypted with your public key
6. **Read Feedback**: Enter your password to decrypt and read feedback in your dashboard

## Security & Privacy

- **No Raw Storage**: Feedback is never stored unencrypted
- **No Private Keys**: We never have access to your decryption keys
- **Open Source**: All code is public and auditable
- **LLM Disclosure**: If OpenRouter is enabled, raw feedback is sent to the model provider for in-memory classification before encryption. We do not store this text. Infrastructure or providers may log network metadata per their policies.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard (never commit real secrets)
4. Deploy!

### Database Migration

The SQL schema in `supabase/schema.sql` contains all necessary tables and RLS policies.

### Delayed delivery & Cron

To enable scheduled delivery:

1. Add environment variables:
   - `CRON_SECRET=<any random string>` (used as Bearer token for cron auth)
   - (optional) `DISPATCH_BATCH_LIMIT=100`
2. If deploying to Vercel, keep `vercel.json` in the repo; configure the Vercel Cron to call `/api/feedback/dispatch-due` (e.g., every 2 minutes). Vercel will send `Authorization: Bearer ${CRON_SECRET}`; the endpoint validates this header.
3. The app stores scheduled items in `scheduled_feedback`, and the cron moves due rows into `feedback` and emails the recipient.

### Sender AI Coach

- The `/api/feedback/analyze` endpoint runs a preflight that:
  - flags anonymity risks and proposes a scrubbed rewrite,
  - suggests ways to make feedback more constructive/actionable,
  - may propose a higher-quality rewrite.
- If the recipient disabled AI filtering, the coach falls back to local heuristics; raw content never leaves the browser.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Passwordless Magic Links)
- **AI**: OpenRouter API (Llama 3.1)
- **Email**: Postmark (simple text emails on new feedback)
- **Encryption**: RSA-OAEP with SHA-256

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
