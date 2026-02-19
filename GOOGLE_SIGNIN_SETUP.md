# 🔐 Google Sign-In Setup Guide

## Overview

This guide will help you set up Google Sign-In for your Grosz wallet app using Supabase OAuth.

---

## ✅ What's Already Done

The app code is ready! Here's what's been implemented:

- ✅ Google Sign-In button added to login screen
- ✅ OAuth flow using Expo WebBrowser
- ✅ Automatic user profile creation for Google users
- ✅ Default "Personal Wallet" creation
- ✅ Session management

**Now you just need to configure Google Cloud Console and Supabase!**

---

## 📋 Setup Steps

### Step 1: Configure Supabase (5 minutes)

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `kehzaqqmkwykxtieoivd`

2. **Enable Google Provider**
   - Go to **Authentication** → **Providers**
   - Find **Google** in the list
   - Toggle it **ON**

3. **Get the Redirect URL**
   - You'll see a **Redirect URL** displayed
   - It should be: `https://kehzaqqmkwykxtieoivd.supabase.co/auth/v1/callback`
   - **Copy this URL** - you'll need it for Google Cloud Console

4. **Leave this page open** - you'll come back to add Google credentials

---

### Step 2: Set Up Google Cloud Console (10 minutes)

#### 2.1 Create a Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project** (or select existing)
   - Click the project dropdown at the top
   - Click **"New Project"**
   - Name it: `Grosz Wallet` (or any name you prefer)
   - Click **"Create"**

#### 2.2 Enable Google+ API

1. **Go to APIs & Services**
   - In the left sidebar, click **"APIs & Services"** → **"Library"**

2. **Enable Google+ API**
   - Search for: `Google+ API`
   - Click on it
   - Click **"Enable"**

#### 2.3 Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**
   - Left sidebar: **"APIs & Services"** → **"OAuth consent screen"**

2. **Choose User Type**
   - Select **"External"**
   - Click **"Create"**

3. **Fill in App Information**
   - **App name**: `Grosz Wallet`
   - **User support email**: Your email
   - **Developer contact email**: Your email
   - Click **"Save and Continue"**

4. **Scopes** (Optional)
   - Click **"Save and Continue"** (default scopes are fine)

5. **Test Users** (For testing)
   - Add your Gmail address as a test user
   - Click **"Save and Continue"**

6. **Summary**
   - Review and click **"Back to Dashboard"**

#### 2.4 Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - Left sidebar: **"APIs & Services"** → **"Credentials"**

2. **Create Credentials**
   - Click **"+ Create Credentials"**
   - Select **"OAuth client ID"**

3. **Configure OAuth Client**
   - **Application type**: Select **"Web application"**
   - **Name**: `Grosz Wallet Web Client`

4. **Add Authorized Redirect URIs**
   - Under **"Authorized redirect URIs"**, click **"+ Add URI"**
   - Paste your Supabase callback URL:
     ```
     https://kehzaqqmkwykxtieoivd.supabase.co/auth/v1/callback
     ```
   - Click **"Create"**

5. **Save Your Credentials**
   - A popup will show your:
     - **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
     - **Client Secret** (looks like: `GOCSPX-abc123...`)
   - **Copy both of these!** You'll need them for Supabase

---

### Step 3: Add Google Credentials to Supabase (2 minutes)

1. **Go back to Supabase Dashboard**
   - **Authentication** → **Providers** → **Google**

2. **Enter Google Credentials**
   - **Client ID**: Paste the Client ID from Google Cloud Console
   - **Client Secret**: Paste the Client Secret from Google Cloud Console

3. **Save**
   - Click **"Save"**

---

## 🧪 Testing

### Test the Google Sign-In Flow

1. **Restart your Expo app**
   ```bash
   # Stop the current server (Ctrl+C)
   npx expo start -c
   ```

2. **Open the app**
   - Go to the login screen

3. **Click "Zaloguj się przez Google"**
   - A browser window should open
   - Sign in with your Google account
   - You should be redirected back to the app
   - You should be logged in!

4. **Verify in Supabase**
   - Go to **Authentication** → **Users**
   - You should see your Google account listed
   - Go to **Table Editor** → **users**
   - Your profile should be created with your Google name and avatar
   - Go to **Table Editor** → **wallets**
   - You should have a "Personal Wallet" created automatically!

---

## 🎯 What Happens When Users Sign In with Google

1. **User clicks "Sign in with Google"**
2. **OAuth flow opens in browser**
3. **User signs in with Google**
4. **Supabase creates auth session**
5. **App checks if user profile exists**
6. **If not, creates profile with:**
   - Name from Google account
   - Email from Google account
   - Avatar from Google profile picture
7. **Database trigger creates "Personal Wallet"**
8. **User is logged in and ready to use the app!**

---

## 🔧 Troubleshooting

### "Error 400: redirect_uri_mismatch"

**Problem**: The redirect URI doesn't match what's configured in Google Cloud Console.

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Make sure the redirect URI is exactly:
   ```
   https://kehzaqqmkwykxtieoivd.supabase.co/auth/v1/callback
   ```
4. No trailing slash, must match exactly

### "Access blocked: This app's request is invalid"

**Problem**: OAuth consent screen not configured properly.

**Solution**:
1. Go to Google Cloud Console → OAuth consent screen
2. Make sure you've completed all required fields
3. Add your email as a test user
4. Try again

### "User profile not created"

**Problem**: The `ensureUserProfile` function might not be working.

**Solution**:
1. Check Supabase logs for errors
2. Make sure the `users` table exists
3. Check that RLS policies allow inserts

### Browser doesn't redirect back to app

**Problem**: WebBrowser session not completing.

**Solution**:
1. Make sure you have `expo-web-browser` installed
2. Check that `WebBrowser.maybeCompleteAuthSession()` is called
3. Try restarting the Expo dev server

---

## 📱 Production Deployment

When you're ready to deploy to production:

1. **Update OAuth Consent Screen**
   - Change from "Testing" to "In Production"
   - This allows any Google user to sign in

2. **Add Production Redirect URIs**
   - If you have a custom domain, add it to Google Cloud Console
   - Example: `https://yourdomain.com/auth/callback`

3. **Update Supabase Redirect URL**
   - In your app code, update the redirect URL if needed

---

## 🎉 You're Done!

Your app now supports Google Sign-In! Users can:
- ✅ Sign up with Google in one click
- ✅ Get automatic profile creation
- ✅ Get a default "Personal Wallet"
- ✅ Start using the app immediately

**Next Steps:**
- Test with different Google accounts
- Add more OAuth providers (Apple, Facebook, etc.)
- Customize the user profile with more Google data

---

## 📚 Additional Resources

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Expo WebBrowser Docs](https://docs.expo.dev/versions/latest/sdk/webbrowser/)
