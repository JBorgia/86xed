-- 86xed Database Schema Setup
-- Run these commands in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  reputation_score INTEGER DEFAULT 0,
  grids_created INTEGER DEFAULT 0,
  total_upvotes INTEGER DEFAULT 0,
  is_creator BOOLEAN DEFAULT FALSE,
  creator_earnings DECIMAL(10,2) DEFAULT 0.00,
  social_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create face profiles table
CREATE TABLE public.face_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  is_celebrity BOOLEAN DEFAULT FALSE,
  ai_detected BOOLEAN DEFAULT FALSE,
  confidence_score DECIMAL(3,2),
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create bingo grids table
CREATE TABLE public.bingo_grids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  faces JSONB NOT NULL, -- Array of face profile references
  center_text TEXT,
  center_qr_code TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  is_viral BOOLEAN DEFAULT FALSE,
  viral_score DECIMAL(10,2) DEFAULT 0.00,
  engagement_score DECIMAL(10,2) DEFAULT 0.00,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shopify_product_id TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  grid_id UUID REFERENCES public.bingo_grids(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(grid_id, user_id)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  grid_id UUID REFERENCES public.bingo_grids(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  depth INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create collections table
CREATE TABLE public.collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  grid_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create collection_grids junction table
CREATE TABLE public.collection_grids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  grid_id UUID REFERENCES public.bingo_grids(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(collection_id, grid_id)
);

-- Create viral metrics table
CREATE TABLE public.viral_metrics (
  grid_id UUID REFERENCES public.bingo_grids(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  shares INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (grid_id, platform)
);

-- Create shared links table for viral tracking
CREATE TABLE public.shared_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  grid_id UUID REFERENCES public.bingo_grids(id) ON DELETE CASCADE NOT NULL,
  short_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  click_count INTEGER DEFAULT 0,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_bingo_grids_created_by ON public.bingo_grids(created_by);
CREATE INDEX idx_bingo_grids_category ON public.bingo_grids(category);
CREATE INDEX idx_bingo_grids_viral_score ON public.bingo_grids(viral_score DESC);
CREATE INDEX idx_bingo_grids_engagement_score ON public.bingo_grids(engagement_score DESC);
CREATE INDEX idx_bingo_grids_created_at ON public.bingo_grids(created_at DESC);
CREATE INDEX idx_bingo_grids_is_public ON public.bingo_grids(is_public);

CREATE INDEX idx_votes_grid_id ON public.votes(grid_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);

CREATE INDEX idx_comments_grid_id ON public.comments(grid_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at);

CREATE INDEX idx_face_profiles_category ON public.face_profiles(category);
CREATE INDEX idx_face_profiles_usage_count ON public.face_profiles(usage_count DESC);
CREATE INDEX idx_face_profiles_name ON public.face_profiles(name);

CREATE INDEX idx_viral_metrics_grid_id ON public.viral_metrics(grid_id);
CREATE INDEX idx_shared_links_grid_id ON public.shared_links(grid_id);
CREATE INDEX idx_shared_links_short_code ON public.shared_links(short_code);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_bingo_grids_updated_at
  BEFORE UPDATE ON public.bingo_grids
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
