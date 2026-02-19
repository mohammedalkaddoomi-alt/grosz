# 🚀 Supabase Setup Guide for Grosz Wallet App

This guide will walk you through setting up Supabase for your Grosz wallet application.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create an account)
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: `grosz-wallet` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Start with the Free tier
4. Click **"Create new project"**
5. Wait for the project to be provisioned (takes ~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, click on the **Settings** icon (⚙️) in the left sidebar
2. Click on **API** under Project Settings
3. You'll see two important values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: A long string starting with `eyJ...`
4. Copy these values - you'll need them in Step 4

## Step 3: Set Up the Database Schema

1. In your Supabase dashboard, click on the **SQL Editor** icon in the left sidebar
2. Click **"New query"**
3. Open the file `supabase_schema.sql` from your project root
4. Copy the entire contents of that file
5. Paste it into the SQL Editor in Supabase
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. You should see a success message

This will create:
- All necessary tables (users, wallets, transactions, goals, categories, etc.)
- Row Level Security (RLS) policies for data protection
- Indexes for better performance
- Default categories for income and expenses
- Real-time subscriptions

## Step 4: Configure Your Frontend

1. Open the `.env` file in your frontend directory:
   ```
   /Users/mohammed/Desktop/ptysia_misia_wallet/cenny/grosz/frontend/.env
   ```

2. Update the Supabase configuration with your actual values:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-actual-key-here
   ```

3. Replace:
   - `your-project-url.supabase.co` with your actual Project URL
   - `your-anon-key-here` with your actual anon/public key

## Step 5: Enable Email Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled (it should be by default)
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize the confirmation and password reset emails if desired

## Step 6: Configure Email Settings (Optional but Recommended)

For production, you'll want to use your own email service:

1. Go to **Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Configure your email provider (SendGrid, Mailgun, etc.)
4. Test the email configuration

For development, you can use Supabase's built-in email service.

## Step 7: Test the Connection

1. Restart your Expo development server:
   ```bash
   # Stop the current server (Ctrl+C)
   npx expo start -c
   ```

2. The app should now connect to Supabase
3. Try creating a new account to test the integration

## Step 8: Verify Database Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see all your tables:
   - users
   - wallets
   - wallet_members
   - categories
   - transactions
   - goals
   - chat_history

3. Click on **categories** table
4. You should see the default categories already populated

## Step 9: Enable Realtime (Already Done!)

The schema setup already enabled realtime for:
- wallets
- transactions
- goals
- wallet_members

You can verify this in **Database** → **Replication** in the Supabase dashboard.

## Step 10: Set Up Row Level Security Policies

The RLS policies are already set up by the schema! You can verify them:

1. Go to **Authentication** → **Policies**
2. Select each table to see its policies
3. All tables should have policies that:
   - Allow users to access only their own data
   - Allow shared wallet members to access shared data
   - Prevent unauthorized access

## 🔒 Security Checklist

- ✅ RLS is enabled on all tables
- ✅ Users can only access their own data
- ✅ Shared wallet members can access shared data
- ✅ API keys are in `.env` file (not committed to git)
- ✅ Database password is secure and saved

## 🎯 Next Steps

Now that Supabase is set up, the app will:

1. **Authentication**: Use Supabase Auth for user registration and login
2. **Database**: Store all data in Supabase PostgreSQL
3. **Real-time**: Get instant updates when data changes
4. **Security**: Benefit from RLS policies protecting user data

## 🐛 Troubleshooting

### "Invalid API key" error
- Double-check that you copied the correct anon/public key
- Make sure there are no extra spaces in the `.env` file
- Restart the Expo server after changing `.env`

### "Failed to fetch" error
- Verify your Project URL is correct
- Check your internet connection
- Make sure the Supabase project is active (not paused)

### Tables not created
- Make sure you ran the entire `supabase_schema.sql` file
- Check the SQL Editor for any error messages
- Try running the schema in smaller chunks if needed

### RLS blocking legitimate requests
- Check the policies in Authentication → Policies
- Verify the user is authenticated
- Check browser console for specific error messages

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth with React Native](https://supabase.com/docs/guides/auth/auth-helpers/react-native)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Subscriptions](https://supabase.com/docs/guides/realtime)

## 🎉 You're All Set!

Your Grosz wallet app is now connected to Supabase! The app will use:
- Supabase Auth for authentication
- Supabase Database for all data storage
- Supabase Realtime for live updates
- Row Level Security for data protection

Happy coding! 💰✨
