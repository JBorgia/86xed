# 86xed Supabase Service

A comprehensive Supabase service for the 86xed viral bingo grid platform. This service handles all backend operations including user management, grid creation, social features, viral tracking, and commerce integration.

## Features

### 🔐 Authentication & User Management

- User profile management with reputation system
- Social links integration
- Creator earnings tracking
- Automatic profile creation on signup

### 🎯 Bingo Grid Management

- Create, read, update, delete grids
- Face profile integration with AI detection
- Viral scoring algorithm
- Engagement metrics tracking
- Public/private grid visibility

### 💬 Social Features

- Reddit-style voting system (upvote/downvote)
- Threaded comment system with depth tracking
- User collections and favorites
- Real-time updates and notifications

### 📊 Analytics & Viral Tracking

- Cross-platform viral metrics
- Share tracking and analytics
- Engagement scoring
- Trending algorithm
- Creator earnings calculation

### 🛒 Commerce Integration

- Shopify product linking
- Revenue tracking per grid
- Creator revenue sharing (40% base rate)
- Viral bonus payments

## Quick Start

### 1. Configuration

Update your environment configuration in `app-config.service.ts`:

```typescript
export const productionConfig: AppConfig = {
  supabase: {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key-here',
  },
  // ... other config
};
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the migration files in order:
   ```sql
   -- Run in Supabase SQL editor
   \i 001_initial_schema.sql
   \i 002_functions_and_triggers.sql
   \i 003_rls_policies.sql
   ```
3. Optionally run seed data:
   ```sql
   \i seed.sql
   ```

### 3. Service Usage

Inject the service in your components:

```typescript
import { SupabaseService } from './core/services/supabase.service';

@Component({...})
export class GridBuilderComponent {
  private supabase = inject(SupabaseService);

  async createGrid() {
    const grid = await this.supabase.createGrid({
      title: 'My Viral Grid',
      category: 'celebrities',
      faces: selectedFaces,
      is_public: true
    });
  }
}
```

## API Reference

### Authentication

```typescript
// Get current user
this.supabase.user$.subscribe((user) => {
  console.log('Current user:', user);
});

// Check authentication status
this.supabase.isAuthenticated$.subscribe((isAuth) => {
  if (isAuth) {
    // User is logged in
  }
});

// Get user profile
this.supabase.userProfile$.subscribe((profile) => {
  console.log('User profile:', profile);
});
```

### Grid Management

```typescript
// Create a new grid
const grid = await this.supabase.createGrid({
  title: 'Celebrity Bingo 2024',
  description: 'Most talked about celebrities',
  category: 'celebrities',
  faces: [
    /* face objects */
  ],
  is_public: true,
});

// Get trending grids
const trending = await this.supabase.getTrendingGrids('24h', 20);

// Get popular grids
const popular = await this.supabase.getPopularGrids(20);

// Update engagement metrics
await this.supabase.updateGridEngagement(gridId, {
  views: 1500,
  shares: 45,
  viral_score: 85.5,
});
```

### Social Features

```typescript
// Vote on a grid
await this.supabase.voteOnGrid(gridId, 'upvote');

// Add a comment
const comment = await this.supabase.addComment(gridId, 'This is so accurate! 😂');

// Add threaded reply
const reply = await this.supabase.addComment(gridId, 'I totally agree!', parentCommentId);

// Get comments
const comments = await this.supabase.getGridComments(gridId);
```

### Real-time Features

```typescript
// Subscribe to grid updates
this.supabase.subscribeToGridUpdates(gridId).subscribe((updatedGrid) => {
  console.log('Grid updated:', updatedGrid);
});

// Subscribe to new comments
this.supabase.subscribeToNewComments(gridId).subscribe((newComment) => {
  console.log('New comment:', newComment);
});
```

### Face Management

```typescript
// Search faces by name/category
const faces = await this.supabase.searchFaces('taylor swift', 'musicians');

// Get faces by category
const celebrities = await this.supabase.getFacesByCategory('celebrities');
```

### Analytics

```typescript
// Track viral metrics
await this.supabase.trackViralMetrics(gridId, 'tiktok', {
  shares: 150,
  clicks: 2300,
  conversions: 45,
  revenue: 125.5,
});

// Get viral metrics
const metrics = await this.supabase.getViralMetrics(gridId);

// Increment views/shares
await this.supabase.incrementGridViews(gridId);
await this.supabase.incrementGridShares(gridId);
```

### Collections

```typescript
// Create a collection
const collection = await this.supabase.createCollection(
  'My Favorites',
  'My favorite viral grids',
  true // public
);

// Add grid to collection
await this.supabase.addGridToCollection(collectionId, gridId);
```

### Commerce Integration

```typescript
// Mark grid as product
await this.supabase.markGridAsProduct(
  gridId,
  'shopify_product_123',
  250.0 // revenue
);
```

## Database Schema

### Core Tables

- **users** - User profiles and stats
- **bingo_grids** - Grid data and metrics
- **face_profiles** - Face library with AI data
- **votes** - Voting system
- **comments** - Threaded comments
- **collections** - User collections
- **viral_metrics** - Cross-platform analytics
- **shared_links** - Link tracking

### Key Features

- **Row Level Security (RLS)** - Secure data access
- **Real-time subscriptions** - Live updates
- **Automatic triggers** - Stats maintenance
- **Stored procedures** - Complex operations
- **Optimized indexes** - Fast queries

## Error Handling

```typescript
try {
  const grid = await this.supabase.createGrid(gridData);
} catch (error) {
  if (error.code === '23505') {
    // Handle duplicate key error
  } else if (error.code === '42501') {
    // Handle permission error
  } else {
    // Handle other errors
    console.error('Grid creation failed:', error);
  }
}
```

## Performance Tips

1. **Use pagination** for large datasets
2. **Subscribe selectively** to real-time updates
3. **Batch operations** when possible
4. **Use indexes** for custom queries
5. **Cache frequently accessed data**

## Security Considerations

1. **Row Level Security** enforces data access rules
2. **Service role** required for admin operations
3. **Input validation** prevents SQL injection
4. **Rate limiting** prevents abuse
5. **Audit trails** track sensitive operations

## Development Workflow

1. **Local Development**

   ```bash
   # Start local Supabase
   npx supabase start

   # Run migrations
   npx supabase db reset
   ```

2. **Testing**

   ```bash
   # Run tests
   npm test

   # Test specific service
   npm test supabase.service
   ```

3. **Deployment**

   ```bash
   # Deploy migrations
   npx supabase db push

   # Deploy functions
   npx supabase functions deploy
   ```

## Troubleshooting

### Common Issues

1. **Connection errors**

   - Check Supabase URL and keys
   - Verify network connectivity
   - Check RLS policies

2. **Permission errors**

   - Verify user authentication
   - Check RLS policies
   - Ensure correct user roles

3. **Real-time issues**
   - Check channel subscriptions
   - Verify RLS policies for real-time
   - Monitor connection status

### Debug Mode

Enable debug logging:

```typescript
// In development
if (environment.development) {
  this.supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event, session);
  });
}
```

## Contributing

1. Follow the established patterns
2. Add proper TypeScript types
3. Include error handling
4. Write tests for new features
5. Update documentation

## Related Services

- **Google AI Service** - Face detection integration
- **Shopify Service** - Commerce integration
- **Social Distribution Service** - Cross-platform sharing
- **Theme Service** - UI theming system

---

For questions or issues, please check the project documentation or create an issue in the repository.
