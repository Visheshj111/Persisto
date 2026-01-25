# Persisto

A calm, flow-focused goal achievement app that prioritizes mental wellbeing over hustle culture.

## Philosophy

Sustainable progress beats rushed achievement. No streaks, no guilt, no pressure.

- One task at a time - See only today's focus
- Guilt-free skipping - Tasks simply shift forward
- AI-powered planning - Realistic, constraint-based daily tasks

## Tech Stack

**Frontend:** React, Vite, TailwindCSS, Zustand, Framer Motion

**Backend:** Node.js, Express, MongoDB, OpenAI API

## Installation

```bash
npm run install:all
```

**Server (.env in /server):**
```
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
OPENAI_API_KEY=your-openai-api-key
PORT=5000
CLIENT_URL=http://localhost:5173
```

**Client (.env in /client):**
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Cloud Deployment (Backend on Fly.io)

### 1. Prepare the Backend for Deployment

- Ensure you have a `Dockerfile` in the `server/` directory (see below).
- Sign up at [Fly.io](https://fly.io/) and install the Fly CLI: https://fly.io/docs/hands-on/install-flyctl/

### 2. Deploying the Backend

```bash
cd server
fly launch  # Follow prompts to set up your app
fly secrets set MONGODB_URI=your-mongodb-uri JWT_SECRET=your-jwt-secret GOOGLE_CLIENT_ID=your-google-client-id OPENAI_API_KEY=your-openai-api-key CLIENT_URL=https://your-frontend-url
fly deploy
```

### 3. Dockerfile Example (server/Dockerfile)

```Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### 4. Update Environment Variables

Set your secrets on Fly.io using `fly secrets set` as shown above. Do not commit secrets to source control.

### 5. Frontend Deployment

Deploy your frontend (Vite/React) to Vercel, Netlify, or another static host. Update `CLIENT_URL` in your backend secrets to match your frontend URL.

---

## Run Locally

```bash
npm run dev
```

## License

MIT
