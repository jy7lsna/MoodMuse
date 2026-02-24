# Mood Muse

AN AI-powered music discovery web app.

## Setup

1. Install dependencies

```bash
npm install
cd server
npm install
```

2. Setup `.env.local`

```
VITE_SPOTIFY_CLIENT_ID=your_id
VITE_SPOTIFY_CLIENT_SECRET=your_secret
VITE_LLM_API_KEY=your_key
```

3. Setup SQLite Database

```bash
cd server
npx prisma generate
npx prisma db push
```

4. Run the app

```bash
# In the root, run the vite server
npm run dev

# In a new terminal, run the backend server
cd server
node server.js
```
