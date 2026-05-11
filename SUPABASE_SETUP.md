# Supabase Integration Guide

Follow these steps to connect your project to Supabase and prepare it for deployment.

## 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and sign in.
2. Click **New Project** and select your organization.
3. Give your project a name and a strong database password.
4. Choose the region closest to your users.
5. Wait for the project to be provisioned.

## 2. Configure Environment Variables
1. In your Supabase Dashboard, go to **Project Settings > API**.
2. Copy the **Project URL** and **anon public** API key.
3. In your project root, create or update your `.env` (or `.env.local`) file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

## 3. Execute Database Schema
1. Go to the **SQL Editor** in your Supabase Dashboard.
2. Click **New Query**.
3. Copy the content from `migration/database-setup.sql` and paste it into the editor.
4. Click **Run**.
   > [!IMPORTANT]
   > Ensure you run the consolidated `database-setup.sql` first. This file now contains all required columns (including `username`), indices, and security policies.

## 4. Setup Storage Buckets
The application requires three storage buckets to be public:
1. Go to **Storage** in the Supabase Dashboard.
3. Create the following buckets:
   - `posts`: Make it **Public**.
   - `stories`: Make it **Public**.
   - `profile_photos`: Make it **Public**.
   - `avatars`: Make it **Public**.
4. Set the allowed MIME types if necessary (e.g., `image/*`, `video/*`).

## 5. Configure OAuth (Google)
To enable "Connect with Google":
1. Go to **Authentication > Providers > Google**.
2. Enable the Google provider.
3. You will need a **Client ID** and **Client Secret** from the [Google Cloud Console](https://console.cloud.google.com/).
4. Add `https://your-project-ref.supabase.co/auth/v1/callback` to your Google Cloud Console "Authorized redirect URIs".
5. In your app, ensure the redirect URL in `auth/page.tsx` points to your production domain's `/auth/callback`.

## 6. Enable Realtime
1. Go to **Database > Replication**.
2. Under **Supabase Managed Publication**, click on `supabase_realtime`.
3. Enable replication for the `posts`, `stories`, and `messages` tables.

## 7. Custom SMTP with Resend
To ensure reliable email delivery (sign-up confirmations, etc.), it is highly recommended to use a custom SMTP provider like **Resend**.

### 1. Setup Resend
1. Create an account at [Resend](https://resend.com/).
2. Go to **Domains** and follow the instructions to verify your domain (Add SPF, DKIM, and DMARC records to your DNS provider).
3. Once verified, go to **API Keys** and create a new API key with "Full Access".

### 2. Configure Supabase
1. In your Supabase Dashboard, go to **Authentication > SMTP Settings**.
2. Enable **Enable Custom SMTP**.
3. Fill in the following details:
   - **Sender Email**: `noreply@yourdomain.com` (Must be a verified domain in Resend)
   - **Sender Name**: `Nomance`
   - **SMTP Host**: `smtp.resend.com`
   - **SMTP Port**: `465` (recommended) or `587`
   - **SMTP User**: `resend`
   - **SMTP Password**: `YOUR_RESEND_API_KEY`
4. Click **Save**.

---

## 8. Deployment
When deploying (e.g., to Vercel):
1. Add your environment variables to the deployment platform.
2. Ensure the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` match your production Supabase project.
