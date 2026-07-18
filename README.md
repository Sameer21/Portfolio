# Portfolio
This repo is a portfolio website for me which i have created as a project as well as info

## Run with contact backend

This portfolio includes a small Node.js backend for the contact form.

```bash
npm start
```

Open `http://localhost:3000`. Contact form submissions are saved to `data/contact-messages.json`.

## Deploy on Vercel

The static portfolio can deploy directly on Vercel. The production contact form uses `api/contact.js`, which stores messages in Upstash Redis through REST environment variables.

1. Connect an Upstash Redis database to your Vercel project from the Vercel Marketplace, or create one in Upstash.
2. Add these Vercel environment variables for Production and Preview:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Redeploy the Vercel project after adding the variables.

Messages are saved in the Redis list key `portfolio:contact-messages`.
