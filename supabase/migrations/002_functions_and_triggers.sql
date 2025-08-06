-- Stored procedures and functions for 86xed platform

-- Function to increment grid views
CREATE OR REPLACE FUNCTION public.increment_grid_views(grid_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.bingo_grids
  SET views = views + 1, updated_at = NOW()
  WHERE id = grid_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment grid shares
CREATE OR REPLACE FUNCTION public.increment_grid_shares(grid_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.bingo_grids
  SET shares = shares + 1, updated_at = NOW()
  WHERE id = grid_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment comment count
CREATE OR REPLACE FUNCTION public.increment_comment_count(grid_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.bingo_grids
  SET comments_count = comments_count + 1, updated_at = NOW()
  WHERE id = grid_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment collection grid count
CREATE OR REPLACE FUNCTION public.increment_collection_count(collection_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.collections
  SET grid_count = grid_count + 1, updated_at = NOW()
  WHERE id = collection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add creator earnings
CREATE OR REPLACE FUNCTION public.add_creator_earnings(user_id UUID, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET creator_earnings = creator_earnings + amount, updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate viral score based on engagement metrics
CREATE OR REPLACE FUNCTION public.calculate_viral_score(grid_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  grid_data RECORD;
  time_factor DECIMAL;
  viral_score DECIMAL;
BEGIN
  SELECT
    upvotes, downvotes, views, shares, comments_count,
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as hours_old
  INTO grid_data
  FROM public.bingo_grids
  WHERE id = grid_id;

  -- Time decay factor (newer content gets higher score)
  time_factor := CASE
    WHEN grid_data.hours_old <= 1 THEN 2.0
    WHEN grid_data.hours_old <= 6 THEN 1.5
    WHEN grid_data.hours_old <= 24 THEN 1.0
    WHEN grid_data.hours_old <= 168 THEN 0.5  -- 1 week
    ELSE 0.1
  END;

  -- Calculate viral score with weighted metrics
  viral_score := (
    (grid_data.upvotes * 1.0) +
    (grid_data.shares * 3.0) +
    (grid_data.comments_count * 2.0) +
    (grid_data.views * 0.01) -
    (grid_data.downvotes * 0.5)
  ) * time_factor;

  -- Update the grid with calculated score
  UPDATE public.bingo_grids
  SET viral_score = viral_score, updated_at = NOW()
  WHERE id = grid_id;

  RETURN viral_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending grids
CREATE OR REPLACE FUNCTION public.get_trending_grids(
  time_period TEXT DEFAULT '24h',
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  viral_score DECIMAL,
  engagement_score DECIMAL,
  upvotes INTEGER,
  views INTEGER,
  shares INTEGER,
  trend_score DECIMAL,
  rank BIGINT
) AS $$
DECLARE
  time_interval INTERVAL;
BEGIN
  -- Convert time period to interval
  time_interval := CASE time_period
    WHEN '1h' THEN INTERVAL '1 hour'
    WHEN '24h' THEN INTERVAL '24 hours'
    WHEN '7d' THEN INTERVAL '7 days'
    WHEN '30d' THEN INTERVAL '30 days'
    ELSE INTERVAL '24 hours'
  END;

  RETURN QUERY
  SELECT
    bg.id,
    bg.title,
    bg.viral_score,
    bg.engagement_score,
    bg.upvotes,
    bg.views,
    bg.shares,
    (bg.viral_score + bg.engagement_score) *
      (1 + (bg.shares::DECIMAL / NULLIF(bg.views, 0))) as trend_score,
    ROW_NUMBER() OVER (ORDER BY
      (bg.viral_score + bg.engagement_score) *
      (1 + (bg.shares::DECIMAL / NULLIF(bg.views, 0))) DESC
    ) as rank
  FROM public.bingo_grids bg
  WHERE
    bg.is_public = true
    AND bg.created_at >= NOW() - time_interval
  ORDER BY trend_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user creation (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update grid engagement score when votes change
CREATE OR REPLACE FUNCTION public.update_grid_engagement()
RETURNS TRIGGER AS $$
DECLARE
  grid_upvotes INTEGER;
  grid_downvotes INTEGER;
  new_engagement_score DECIMAL;
BEGIN
  -- Count current votes for the grid
  SELECT
    COUNT(*) FILTER (WHERE vote_type = 'upvote'),
    COUNT(*) FILTER (WHERE vote_type = 'downvote')
  INTO grid_upvotes, grid_downvotes
  FROM public.votes
  WHERE grid_id = COALESCE(NEW.grid_id, OLD.grid_id);

  -- Calculate engagement score (can be customized)
  new_engagement_score := (grid_upvotes * 1.5) - (grid_downvotes * 0.5);

  -- Update the grid
  UPDATE public.bingo_grids
  SET
    upvotes = grid_upvotes,
    downvotes = grid_downvotes,
    engagement_score = new_engagement_score,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.grid_id, OLD.grid_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for vote changes
CREATE TRIGGER on_vote_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_grid_engagement();

-- Function to increment tile usage count
CREATE OR REPLACE FUNCTION public.increment_face_usage(face_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE public.face_profiles
  SET usage_count = usage_count + 1
  WHERE id = ANY(face_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user stats when grid is created
CREATE OR REPLACE FUNCTION public.update_user_stats_on_grid_creation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    grids_created = grids_created + 1,
    updated_at = NOW()
  WHERE id = NEW.created_by;

  -- Extract tile IDs from the grid and increment usage
  IF NEW.faces IS NOT NULL THEN
    PERFORM public.increment_face_usage(
      ARRAY(SELECT (face->>'id')::UUID FROM jsonb_array_elements(NEW.faces) AS tile)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for grid creation
CREATE TRIGGER on_grid_created
  AFTER INSERT ON public.bingo_grids
  FOR EACH ROW EXECUTE FUNCTION public.update_user_stats_on_grid_creation();
