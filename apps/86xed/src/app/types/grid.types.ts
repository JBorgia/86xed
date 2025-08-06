// Core grid and face types for the 86xed viral bingo platform
export interface Face {
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
  faces: Face[];
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
  faces: Partial<Face>[];
  theme: string;
  tags: string[];
}

export interface GridGenerationRequest {
  theme: string;
  faces: Face[];
  customization?: {
    backgroundColor: string;
    textColor: string;
    gridSize: '3x3' | '4x4' | '5x5';
  };
}
