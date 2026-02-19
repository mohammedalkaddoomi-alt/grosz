# 📝 Migration Guide: Updating App Code to Use Supabase

This guide explains how to update your existing app code to use the new Supabase services.

## Overview

We've created three new service files:
1. **`authService.ts`** - Handles authentication (register, login, logout)
2. **`database.ts`** - Handles all database operations (wallets, transactions, goals, etc.)
3. **`supabase.ts`** - Supabase client configuration

## Migration Strategy

You have two options:

### Option A: Gradual Migration (Recommended for Testing)
Keep the existing `api.ts` and gradually replace calls with Supabase services. This allows you to test each feature before fully committing.

### Option B: Full Migration
Replace all API calls with Supabase services at once. Faster but requires more testing.

## Step-by-Step Migration

### 1. Authentication Updates

**Old code (using api.ts):**
```typescript
import { api } from '@/services/api';

// Register
await api.register(email, password, name);

// Login
await api.login(email, password);

// Logout
api.logout();

// Get current user
await api.getMe();
```

**New code (using authService.ts):**
```typescript
import { authService } from '@/services/authService';

// Register
const { user, session, error } = await authService.register(email, password, name);
if (error) {
  console.error('Registration failed:', error.message);
}

// Login
const { user, session, error } = await authService.login(email, password);
if (error) {
  console.error('Login failed:', error.message);
}

// Logout
await authService.logout();

// Get current user
const user = await authService.getCurrentUser();
```

### 2. Wallet Operations

**Old code:**
```typescript
// Get wallets
const wallets = await api.getWallets();

// Create wallet
await api.createWallet({ name, emoji, is_shared });

// Update wallet
await api.updateWallet(id, { name, emoji });

// Delete wallet
await api.deleteWallet(id);
```

**New code:**
```typescript
import { db } from '@/services/database';
import { authService } from '@/services/authService';

// Get current user ID
const user = await authService.getCurrentUser();
const userId = user?.id;

// Get wallets
const wallets = await db.getWallets(userId);

// Create wallet
await db.createWallet(userId, { name, emoji, is_shared });

// Update wallet
await db.updateWallet(id, { name, emoji });

// Delete wallet
await db.deleteWallet(id);
```

### 3. Transaction Operations

**Old code:**
```typescript
// Get transactions
const transactions = await api.getTransactions(walletId);

// Create transaction
await api.createTransaction({
  wallet_id: walletId,
  category_id: categoryId,
  amount,
  type,
  description,
});

// Delete transaction
await api.deleteTransaction(id);
```

**New code:**
```typescript
import { db } from '@/services/database';

// Get transactions
const transactions = await db.getTransactions(walletId);

// Create transaction
const user = await authService.getCurrentUser();
await db.createTransaction({
  wallet_id: walletId,
  category_id: categoryId,
  user_id: user.id,
  amount,
  type,
  description,
});

// Delete transaction
await db.deleteTransaction(id);

// Get wallet balance
const balance = await db.getWalletBalance(walletId);
```

### 4. Goals Operations

**Old code:**
```typescript
// Get goals
const goals = await api.getGoals();

// Create goal
await api.createGoal({ name, target_amount, emoji });

// Contribute to goal
await api.contributeToGoal(id, amount);

// Delete goal
await api.deleteGoal(id);
```

**New code:**
```typescript
import { db } from '@/services/database';

const user = await authService.getCurrentUser();

// Get goals
const goals = await db.getGoals(user.id);

// Create goal
await db.createGoal({
  user_id: user.id,
  name,
  target_amount,
  emoji,
});

// Contribute to goal
await db.contributeToGoal(id, amount);

// Delete goal
await db.deleteGoal(id);
```

### 5. Categories Operations

**Old code:**
```typescript
// Get categories
const categories = await api.getCategories('expense');

// Create category
await api.createCategory({ name, emoji, type });

// Delete category
await api.deleteCategory(id);
```

**New code:**
```typescript
import { db } from '@/services/database';

const user = await authService.getCurrentUser();

// Get categories (includes system + user's custom categories)
const categories = await db.getCategories('expense', user.id);

// Create category
await db.createCategory({
  name,
  emoji,
  type,
  user_id: user.id,
});

// Delete category
await db.deleteCategory(id);
```

### 6. Dashboard Stats

**Old code:**
```typescript
const stats = await api.getStats();
```

**New code:**
```typescript
import { db } from '@/services/database';

const user = await authService.getCurrentUser();
const stats = await db.getStats(user.id);
```

### 7. Shared Wallet Operations

**Old code:**
```typescript
// Invite to wallet
await api.inviteToWallet(walletId, email);

// Get wallet members
await api.getWalletMembers(walletId);

// Remove from wallet
await api.removeFromWallet(walletId, userId);

// Leave wallet
await api.leaveWallet(walletId);
```

**New code:**
```typescript
import { db } from '@/services/database';

// Search for user by email first
const users = await db.searchUsers(email);
const userToInvite = users[0];

// Invite to wallet
await db.inviteToWallet(walletId, userToInvite.id);

// Get wallet members
const members = await db.getWalletMembers(walletId);

// Remove from wallet
await db.removeFromWallet(walletId, userId);

// Leave wallet
const currentUser = await authService.getCurrentUser();
await db.leaveWallet(walletId, currentUser.id);
```

### 8. Real-time Updates (NEW Feature!)

Supabase provides real-time subscriptions. Here's how to use them:

```typescript
import { db } from '@/services/database';
import { useEffect } from 'react';

// Subscribe to transaction changes
useEffect(() => {
  const subscription = db.subscribeToTransactions(walletId, (payload) => {
    console.log('Transaction changed:', payload);
    // Refresh your transactions list
    refreshTransactions();
  });

  return () => {
    subscription.unsubscribe();
  };
}, [walletId]);

// Subscribe to wallet changes
useEffect(() => {
  const subscription = db.subscribeToWallets(userId, (payload) => {
    console.log('Wallet changed:', payload);
    // Refresh your wallets list
    refreshWallets();
  });

  return () => {
    subscription.unsubscribe();
  };
}, [userId]);
```

## Files That Need Updates

Here are the main files you'll need to update:

### Store Files
- `/frontend/src/store/` - Update Zustand stores to use new services

### Screen/Component Files
Look for any files that import and use `api.ts`:
```bash
# Find files using the old API
grep -r "from '@/services/api'" frontend/src/
grep -r "from '../services/api'" frontend/src/
```

Common files that likely need updates:
- Authentication screens (login, register)
- Wallet screens
- Transaction screens
- Goals screens
- Dashboard/Home screen
- Settings screen

## Testing Checklist

After migration, test these features:

- [ ] User registration
- [ ] User login
- [ ] User logout
- [ ] Create wallet
- [ ] View wallets
- [ ] Update wallet
- [ ] Delete wallet
- [ ] Create transaction
- [ ] View transactions
- [ ] Delete transaction
- [ ] Create goal
- [ ] Contribute to goal
- [ ] Delete goal
- [ ] Create category
- [ ] View categories
- [ ] Invite user to shared wallet
- [ ] View wallet members
- [ ] Leave shared wallet
- [ ] Real-time updates

## Common Issues & Solutions

### Issue: "User is null"
**Solution:** Make sure to check if user is authenticated before making database calls:
```typescript
const user = await authService.getCurrentUser();
if (!user) {
  // Redirect to login
  return;
}
```

### Issue: "RLS policy violation"
**Solution:** This means the user doesn't have permission. Check:
1. User is authenticated
2. User has access to the resource (e.g., is a member of the wallet)
3. RLS policies are correctly set up in Supabase

### Issue: "Cannot read property 'id' of null"
**Solution:** Add null checks:
```typescript
const user = await authService.getCurrentUser();
if (!user?.id) {
  console.error('No user logged in');
  return;
}
```

## Benefits of Supabase Migration

✅ **Real-time updates** - See changes instantly across devices
✅ **Better security** - Row Level Security protects user data
✅ **Simpler code** - No need to manage JWT tokens manually
✅ **Offline support** - Supabase handles session persistence
✅ **Type safety** - Full TypeScript support with generated types
✅ **Scalability** - Supabase handles scaling automatically

## Next Steps

1. Follow the SUPABASE_SETUP.md guide to set up your Supabase project
2. Update your `.env` file with Supabase credentials
3. Start migrating one feature at a time (recommend starting with authentication)
4. Test thoroughly after each migration
5. Remove old `api.ts` once everything is migrated

Need help? Check the Supabase documentation or the files we created:
- `authService.ts` - Authentication examples
- `database.ts` - Database operation examples
- `supabase_schema.sql` - Database structure

Happy migrating! 🚀
