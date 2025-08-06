-- Row Level Security (RLS) policies for 86xed platform

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bingo_grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view all public profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Bingo grids policies
CREATE POLICY "Anyone can view public grids" ON public.bingo_grids
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create grids" ON public.bingo_grids
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

CREATE POLICY "Users can update their own grids" ON public.bingo_grids
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own grids" ON public.bingo_grids
  FOR DELETE USING (created_by = auth.uid());

-- tile profiles policies (public read, admin write)
CREATE POLICY "Anyone can view tile profiles" ON public.face_profiles
  FOR SELECT USING (true);

-- Only service role can insert tile profiles (via admin functions)
CREATE POLICY "Service role can manage tile profiles" ON public.face_profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Votes policies
CREATE POLICY "Anyone can view votes" ON public.votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON public.votes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Users can update their own votes" ON public.votes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own votes" ON public.votes
  FOR DELETE USING (user_id = auth.uid());

-- Comments policies
CREATE POLICY "Anyone can view comments on public grids" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bingo_grids
      WHERE id = grid_id AND (is_public = true OR created_by = auth.uid())
    )
  );

CREATE POLICY "Authenticated users can comment" ON public.comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (user_id = auth.uid());

-- Collections policies
CREATE POLICY "Anyone can view public collections" ON public.collections
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create collections" ON public.collections
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Users can update their own collections" ON public.collections
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own collections" ON public.collections
  FOR DELETE USING (user_id = auth.uid());

-- Collection grids policies
CREATE POLICY "Anyone can view collection grids for public collections" ON public.collection_grids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE id = collection_id AND (is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Collection owners can manage collection grids" ON public.collection_grids
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE id = collection_id AND user_id = auth.uid()
    )
  );

-- Viral metrics policies (read-only for users, write for service)
CREATE POLICY "Anyone can view viral metrics" ON public.viral_metrics
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage viral metrics" ON public.viral_metrics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Shared links policies
CREATE POLICY "Anyone can view shared links" ON public.shared_links
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage shared links" ON public.shared_links
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grid creators can create shared links for their grids
CREATE POLICY "Grid creators can create shared links" ON public.shared_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bingo_grids
      WHERE id = grid_id AND created_by = auth.uid()
    )
  );

-- Create views for common queries
CREATE VIEW public.trending_grids AS
SELECT
  bg.*,
  u.username as creator_username,
  u.display_name as creator_display_name,
  u.avatar_url as creator_avatar_url,
  (bg.viral_score + bg.engagement_score) *
    (1 + (bg.shares::DECIMAL / NULLIF(bg.views, 0))) as trend_score,
  ROW_NUMBER() OVER (ORDER BY
    (bg.viral_score + bg.engagement_score) *
    (1 + (bg.shares::DECIMAL / NULLIF(bg.views, 0))) DESC
  ) as rank
FROM public.bingo_grids bg
JOIN public.users u ON bg.created_by = u.id
WHERE bg.is_public = true
  AND bg.created_at >= NOW() - INTERVAL '7 days'
ORDER BY trend_score DESC;

CREATE VIEW public.user_stats AS
SELECT
  u.id as user_id,
  u.username,
  u.display_name,
  u.grids_created as total_grids,
  u.total_upvotes,
  COALESCE(SUM(bg.views), 0) as total_views,
  u.creator_earnings as total_earnings,
  u.reputation_score,
  ROW_NUMBER() OVER (ORDER BY u.reputation_score DESC) as rank
FROM public.users u
LEFT JOIN public.bingo_grids bg ON u.id = bg.created_by
GROUP BY u.id, u.username, u.display_name, u.grids_created,
         u.total_upvotes, u.creator_earnings, u.reputation_score;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Grant select on views
GRANT SELECT ON public.trending_grids TO anon, authenticated;
GRANT SELECT ON public.user_stats TO anon, authenticated;
