// Social media and viral metrics types
export interface SocialMetrics {
  shares: number;
  likes: number;
  comments: number;
  saves: number;
}

export interface ViralMetrics {
  viralScore: number;
  engagementScore: number;
  sharesCount: number;
  completionsCount: number;
  trendingScore: number;
}

export interface SocialShareData {
  platform: 'twitter' | 'instagram' | 'facebook' | 'tiktok';
  content: string;
  imageUrl: string;
  hashtags: string[];
}
