// Core grid and tile types for the 86xed viral bingo platform
export interface tile {
  id: string;
  imageUrl: string;
  name?: string;
  celebrity?: boolean;
  confidence: number;
  position: { x: number; y: number };
  metadata: {
    aiDetected: boolean;
    verified: boolean;
    source: string;
  };
}

export interface BingoGrid {
  id: string;
  title: string;
  description: string;
  tiles: tile[];
  theme: string;
  createdBy: string;
  viralScore: number;
  engagementScore: number;
  shopifyProductId?: string;
  status: 'draft' | 'published' | 'viral' | 'monetized';
  metadata: {
    tags: string[];
    categories: string[];
    aiEnhanced: boolean;
    printReady: boolean;
  };
  socialMetrics: {
    shares: number;
    likes: number;
    comments: number;
    saves: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface GridInput {
  title: string;
  description: string;
  tiles: Partial<tile>[];
  theme: string;
  tags: string[];
}

export interface GridGenerationRequest {
  theme: string;
  tiles: tile[];
  customization?: {
    backgroundColor: string;
    textColor: string;
    gridSize: '3x3' | '4x4' | '5x5';
  };
}
