-- Sample seed data for 86xed platform development
-- Run this after the schema is created

-- Insert sample face profiles for different categories
INSERT INTO public.face_profiles (name, image_url, category, is_celebrity, ai_detected, confidence_score, tags) VALUES
-- Celebrities
('Taylor Swift', 'https://example.com/faces/taylor-swift.jpg', 'musicians', true, true, 0.98, ARRAY['pop', 'country', 'grammy-winner']),
('Dwayne Johnson', 'https://example.com/faces/the-rock.jpg', 'actors', true, true, 0.95, ARRAY['action', 'wrestling', 'fast-furious']),
('Elon Musk', 'https://example.com/faces/elon-musk.jpg', 'entrepreneurs', true, true, 0.92, ARRAY['tesla', 'spacex', 'twitter']),
('Ariana Grande', 'https://example.com/faces/ariana-grande.jpg', 'musicians', true, true, 0.97, ARRAY['pop', 'r&b', 'nickelodeon']),
('Leonardo DiCaprio', 'https://example.com/faces/leonardo-dicaprio.jpg', 'actors', true, true, 0.94, ARRAY['oscar-winner', 'titanic', 'environmental']),

-- Politicians
('Barack Obama', 'https://example.com/faces/barack-obama.jpg', 'politicians', true, true, 0.99, ARRAY['president', 'democrat', 'hope']),
('Donald Trump', 'https://example.com/faces/donald-trump.jpg', 'politicians', true, true, 0.96, ARRAY['president', 'republican', 'businessman']),
('Alexandria Ocasio-Cortez', 'https://example.com/faces/aoc.jpg', 'politicians', true, true, 0.93, ARRAY['congress', 'progressive', 'young']),

-- Athletes
('LeBron James', 'https://example.com/faces/lebron-james.jpg', 'athletes', true, true, 0.98, ARRAY['basketball', 'nba', 'lakers']),
('Serena Williams', 'https://example.com/faces/serena-williams.jpg', 'athletes', true, true, 0.96, ARRAY['tennis', 'champion', 'goat']),
('Tom Brady', 'https://example.com/faces/tom-brady.jpg', 'athletes', true, true, 0.95, ARRAY['football', 'nfl', 'quarterback']),

-- Influencers/TikTokers
('MrBeast', 'https://example.com/faces/mrbeast.jpg', 'youtubers', true, true, 0.91, ARRAY['youtube', 'challenges', 'philanthropy']),
('Charli DAmelio', 'https://example.com/faces/charli-damelio.jpg', 'tiktokers', true, true, 0.89, ARRAY['tiktok', 'dance', 'gen-z']),
('James Charles', 'https://example.com/faces/james-charles.jpg', 'influencers', true, true, 0.87, ARRAY['makeup', 'beauty', 'youtube']),
('Emma Chamberlain', 'https://example.com/faces/emma-chamberlain.jpg', 'youtubers', true, true, 0.86, ARRAY['lifestyle', 'coffee', 'relatable']),

-- Reality TV
('Kim Kardashian', 'https://example.com/faces/kim-kardashian.jpg', 'reality-tv', true, true, 0.97, ARRAY['kardashians', 'business', 'fashion']),
('Gordon Ramsay', 'https://example.com/faces/gordon-ramsay.jpg', 'chefs', true, true, 0.94, ARRAY['cooking', 'hells-kitchen', 'british'])

ON CONFLICT (name) DO NOTHING;

-- Create some sample collections for demonstration
INSERT INTO public.collections (id, name, description, user_id, is_public) VALUES
(uuid_generate_v4(), 'Trending Celebrities 2024', 'The most talked about celebrities this year', (SELECT id FROM auth.users LIMIT 1), true),
(uuid_generate_v4(), 'Political Figures', 'Current political personalities making headlines', (SELECT id FROM auth.users LIMIT 1), true),
(uuid_generate_v4(), 'Sports Legends', 'Greatest athletes of all time', (SELECT id FROM auth.users LIMIT 1), true),
(uuid_generate_v4(), 'TikTok Stars', 'Viral TikTok creators everyone knows', (SELECT id FROM auth.users LIMIT 1), true)
ON CONFLICT DO NOTHING;

-- Insert sample viral metrics data
INSERT INTO public.viral_metrics (grid_id, platform, shares, clicks, conversions, revenue)
SELECT
  bg.id,
  platform,
  FLOOR(RANDOM() * 1000 + 10)::INTEGER as shares,
  FLOOR(RANDOM() * 5000 + 100)::INTEGER as clicks,
  FLOOR(RANDOM() * 50 + 1)::INTEGER as conversions,
  ROUND((RANDOM() * 500 + 10)::NUMERIC, 2) as revenue
FROM public.bingo_grids bg
CROSS JOIN (VALUES ('tiktok'), ('instagram'), ('twitter'), ('facebook')) AS platforms(platform)
WHERE bg.viral_score > 50  -- Only for viral grids
ON CONFLICT DO NOTHING;

-- Create some sample shared links
INSERT INTO public.shared_links (grid_id, short_code, original_url, click_count, referrer)
SELECT
  bg.id,
  substr(md5(random()::text), 0, 8) as short_code,
  'https://86xed.com/grid/' || bg.id as original_url,
  FLOOR(RANDOM() * 1000)::INTEGER as click_count,
  CASE FLOOR(RANDOM() * 4)
    WHEN 0 THEN 'tiktok.com'
    WHEN 1 THEN 'instagram.com'
    WHEN 2 THEN 'twitter.com'
    ELSE 'direct'
  END as referrer
FROM public.bingo_grids bg
WHERE bg.is_viral = true
ON CONFLICT (short_code) DO NOTHING;

-- Update face usage counts based on grid usage
UPDATE public.face_profiles fp
SET usage_count = (
  SELECT COUNT(*)
  FROM public.bingo_grids bg,
       jsonb_array_elements(bg.faces) as face_elem
  WHERE (face_elem->>'id')::UUID = fp.id
);

-- Create sample grid categories data
INSERT INTO public.bingo_grids (title, description, category, faces, is_public, viral_score, engagement_score, upvotes, views, shares, created_by)
SELECT
  'Sample ' || category || ' Bingo Grid #' || generate_series,
  'A viral bingo grid featuring popular ' || category || ' personalities',
  category,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', fp.id,
        'name', fp.name,
        'image_url', fp.image_url,
        'category', fp.category
      )
    )
    FROM (
      SELECT * FROM public.face_profiles
      WHERE category = cat.category
      ORDER BY random()
      LIMIT 25
    ) fp
  ) as faces,
  true as is_public,
  ROUND((RANDOM() * 200)::NUMERIC, 2) as viral_score,
  ROUND((RANDOM() * 150)::NUMERIC, 2) as engagement_score,
  FLOOR(RANDOM() * 500)::INTEGER as upvotes,
  FLOOR(RANDOM() * 10000 + 100)::INTEGER as views,
  FLOOR(RANDOM() * 200)::INTEGER as shares,
  (SELECT id FROM auth.users ORDER BY random() LIMIT 1) as created_by
FROM (VALUES
  ('musicians'),
  ('actors'),
  ('politicians'),
  ('athletes'),
  ('influencers'),
  ('tiktokers'),
  ('youtubers'),
  ('reality-tv')
) AS cat(category)
CROSS JOIN generate_series(1, 2)  -- 2 grids per category
WHERE EXISTS (SELECT 1 FROM public.face_profiles WHERE category = cat.category);

-- Update grid viral status based on score
UPDATE public.bingo_grids
SET is_viral = true
WHERE viral_score > 100;

-- Create sample comments for grids
INSERT INTO public.comments (grid_id, user_id, content, upvotes)
SELECT
  bg.id,
  (SELECT id FROM auth.users ORDER BY random() LIMIT 1),
  CASE FLOOR(RANDOM() * 5)
    WHEN 0 THEN 'This is so accurate! 😂'
    WHEN 1 THEN 'Missing [celebrity name] though!'
    WHEN 2 THEN 'Perfect for my friend group'
    WHEN 3 THEN 'Need this on a shirt ASAP'
    ELSE 'Going viral for sure!'
  END,
  FLOOR(RANDOM() * 50)::INTEGER
FROM public.bingo_grids bg
WHERE bg.is_public = true
ORDER BY random()
LIMIT 100;  -- 100 random comments

-- Update grid comment counts
UPDATE public.bingo_grids bg
SET comments_count = (
  SELECT COUNT(*)
  FROM public.comments c
  WHERE c.grid_id = bg.id
);

-- Create some sample votes
INSERT INTO public.votes (grid_id, user_id, vote_type)
SELECT
  bg.id,
  u.id,
  CASE WHEN RANDOM() > 0.2 THEN 'upvote' ELSE 'downvote' END
FROM public.bingo_grids bg
CROSS JOIN auth.users u
WHERE RANDOM() > 0.7  -- Only 30% of user-grid combinations get votes
ON CONFLICT (grid_id, user_id) DO NOTHING;

-- Recalculate engagement scores after votes
SELECT public.calculate_viral_score(id) FROM public.bingo_grids;

-- Analyze the data for insights
SELECT
  'Database seeded successfully!' as message,
  (SELECT COUNT(*) FROM public.face_profiles) as face_profiles_count,
  (SELECT COUNT(*) FROM public.bingo_grids) as grids_count,
  (SELECT COUNT(*) FROM public.votes) as votes_count,
  (SELECT COUNT(*) FROM public.comments) as comments_count,
  (SELECT COUNT(*) FROM public.viral_metrics) as viral_metrics_count;
