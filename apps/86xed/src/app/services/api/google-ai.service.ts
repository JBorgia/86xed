import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { tile } from '../../types/index';

export interface GoogleVisionResponse {
  responses: Array<{
    tileAnnotations?: Array<{
      boundingPoly: {
        vertices: Array<{ x: number; y: number }>;
      };
      fdBoundingPoly: {
        vertices: Array<{ x: number; y: number }>;
      };
      landmarks: Array<{
        type: string;
        position: { x: number; y: number; z: number };
      }>;
      rollAngle: number;
      panAngle: number;
      tiltAngle: number;
      detectionConfidence: number;
      landmarkingConfidence: number;
      joyLikelihood: string;
      sorrowLikelihood: string;
      angerLikelihood: string;
      surpriseLikelihood: string;
      underExposedLikelihood: string;
      blurredLikelihood: string;
      headwearLikelihood: string;
    }>;
    webDetection?: {
      webEntities: Array<{
        entityId?: string;
        score: number;
        description?: string;
      }>;
      fullMatchingImages: Array<{
        url: string;
      }>;
      partialMatchingImages: Array<{
        url: string;
      }>;
      pagesWithMatchingImages: Array<{
        url: string;
        pageTitle: string;
      }>;
    };
  }>;
}

export interface CelebrityData {
  name: string;
  confidence: number;
  knowledgeGraphMid: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleAIService {
  private readonly apiKey = 'YOUR_GOOGLE_VISION_API_KEY';
  private readonly visionApiUrl =
    'https://vision.googleapis.com/v1/images:annotate';
  private http = inject(HttpClient);

  /**
   * Detect celebrities and enhance tile data with AI
   */
  async detectCelebrities(tiles: Partial<tile>[]): Promise<tile[]> {
    const enhancedTiles: tile[] = [];

    for (const tile of tiles) {
      try {
        console.log('🤖 Processing tile with Google Vision AI...');

        if (!tile.imageUrl) {
          console.warn('⚠️ tile missing image URL, skipping AI enhancement');
          continue;
        }

        // Detect tiles and celebrities
        const visionResult = await this.analyzeImage(tile.imageUrl);
        const celebrityData = await this.identifyCelebrity(tile.imageUrl);

        const enhancedTile: tile = {
          id: tile.id || this.generateTileId(),
          imageUrl: tile.imageUrl,
          name: celebrityData?.name || tile.name || 'Unknown',
          celebrity: !!celebrityData,
          confidence:
            celebrityData?.confidence ||
            this.calculateTileQuality(visionResult),
          position: tile.position || { x: 0, y: 0 },
          metadata: {
            aiDetected: true,
            verified: !!celebrityData,
            source: celebrityData ? 'google-knowledge-graph' : 'user-upload',
          },
        };

        enhancedTiles.push(enhancedTile);
        console.log(
          `✅ Enhanced tile: ${enhancedTile.name} (${enhancedTile.confidence}% confidence)`
        );
      } catch (error) {
        console.error('❌ tile enhancement failed:', error);

        // Fallback: create basic tile object
        const basicTile: tile = {
          id: tile.id || this.generateTileId(),
          imageUrl: tile.imageUrl || '',
          name: tile.name || 'Unknown',
          celebrity: false,
          confidence: 0.5,
          position: tile.position || { x: 0, y: 0 },
          metadata: {
            aiDetected: false,
            verified: false,
            source: 'user-upload',
          },
        };

        enhancedTiles.push(basicTile);
      }
    }

    return enhancedTiles;
  }

  /**
   * Analyze image quality and tile detection
   */
  async analyzeImage(imageUrl: string): Promise<GoogleVisionResponse> {
    const requestBody = {
      requests: [
        {
          image: {
            source: {
              imageUri: imageUrl,
            },
          },
          features: [
            {
              type: 'TILE_DETECTION',
              maxResults: 10,
            },
            {
              type: 'WEB_DETECTION',
              maxResults: 20,
            },
          ],
        },
      ],
    };

    const response = await this.http
      .post<GoogleVisionResponse>(
        `${this.visionApiUrl}?key=${this.apiKey}`,
        requestBody
      )
      .toPromise();

    if (!response) {
      throw new Error('Failed to analyze image with Google Vision');
    }

    return response;
  }

  /**
   * Identify if the tile belongs to a celebrity
   */
  async identifyCelebrity(imageUrl: string): Promise<CelebrityData | null> {
    try {
      // Use Google Vision Web Detection to find similar images
      const visionResult = await this.analyzeImage(imageUrl);
      const webDetection = visionResult.responses[0]?.webDetection;

      if (!webDetection?.webEntities) {
        return null;
      }

      // Look for high-confidence entities that could be celebrities
      const celebrityEntities = webDetection.webEntities
        .filter(
          (entity) =>
            entity.description &&
            entity.score > 0.7 &&
            this.isCelebrityDescription(entity.description)
        )
        .sort((a, b) => b.score - a.score);

      if (celebrityEntities.length === 0) {
        return null;
      }

      const topEntity = celebrityEntities[0];

      return {
        name: topEntity.description || 'Unknown Celebrity',
        confidence: Math.round(topEntity.score * 100),
        knowledgeGraphMid: topEntity.entityId || '',
        description: `Celebrity detected with ${Math.round(
          topEntity.score * 100
        )}% confidence`,
      };
    } catch (error) {
      console.error('❌ Celebrity identification failed:', error);
      return null;
    }
  }

  /**
   * Generate meme text suggestions based on detected tiles
   */
  async generateMemeText(tiles: tile[]): Promise<string[]> {
    const suggestions: string[] = [];

    for (const tile of tiles) {
      if (tile.celebrity && tile.name !== 'Unknown') {
        // Generate celebrity-specific meme text
        suggestions.push(
          `When ${tile.name} sees your bingo card`,
          `${tile.name} approves this bingo`,
          `POV: You're ${tile.name} playing bingo`,
          `${tile.name} when someone gets bingo before them`
        );
      } else {
        // Generate generic meme text
        suggestions.push(
          'When you get bingo first',
          'That tile when you almost win',
          "POV: You're one square away from bingo",
          'When someone calls out your number'
        );
      }
    }

    // Add viral bingo-specific suggestions
    suggestions.push(
      'This bingo card hits different',
      'When the bingo card is too relatable',
      'Tag someone who needs to see this bingo',
      'This bingo card called me out',
      'POV: This bingo card is your entire personality'
    );

    // Return top 5 unique suggestions
    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * Analyze viral potential based on tile composition
   */
  calculateViralScore(tiles: tile[]): number {
    let score = 0;

    // Celebrity bonus
    const celebrityCount = tiles.filter((f) => f.celebrity).length;
    score += celebrityCount * 0.3;

    // tile quality bonus
    const avgQuality =
      tiles.reduce((sum, f) => sum + f.confidence, 0) / tiles.length;
    score += avgQuality * 0.3;

    // Diversity bonus (different types of tiles)
    const diversity = this.calculateTileDiversity(tiles);
    score += diversity * 0.2;

    // Meme potential bonus
    const memeScore = this.calculateMemeScore(tiles);
    score += memeScore * 0.2;

    return Math.min(score, 1);
  }

  /**
   * Private helper methods
   */
  private calculateTileQuality(visionResult: GoogleVisionResponse): number {
    const tileAnnotations = visionResult.responses[0]?.tileAnnotations;

    if (!tileAnnotations || tileAnnotations.length === 0) {
      return 0.5; // Default confidence
    }

    // Use detection confidence and quality indicators
    const tile = tileAnnotations[0];
    let quality = tile.detectionConfidence;

    // Reduce quality for blurred or poorly lit images
    if (
      tile.blurredLikelihood === 'LIKELY' ||
      tile.blurredLikelihood === 'VERY_LIKELY'
    ) {
      quality *= 0.7;
    }

    if (
      tile.underExposedLikelihood === 'LIKELY' ||
      tile.underExposedLikelihood === 'VERY_LIKELY'
    ) {
      quality *= 0.8;
    }

    return Math.round(quality * 100) / 100;
  }

  private isCelebrityDescription(description: string): boolean {
    const celebrityKeywords = [
      'actor',
      'actress',
      'singer',
      'musician',
      'artist',
      'celebrity',
      'performer',
      'entertainer',
      'comedian',
      'director',
      'producer',
      'influencer',
      'personality',
      'star',
      'famous',
    ];

    const lowerDesc = description.toLowerCase();
    return celebrityKeywords.some((keyword) => lowerDesc.includes(keyword));
  }

  private calculateTileDiversity(tiles: tile[]): number {
    // Simple diversity calculation based on celebrity vs non-celebrity mix
    const celebrityCount = tiles.filter((f) => f.celebrity).length;
    const nonCelebrityCount = tiles.length - celebrityCount;

    if (tiles.length <= 1) return 0;

    // Best diversity is a mix of both types
    const ratio = Math.min(celebrityCount, nonCelebrityCount) / tiles.length;
    return ratio * 2; // Scale to 0-1 range
  }

  private calculateMemeScore(tiles: tile[]): number {
    // tiles with expressive features or recognizable personalities score higher
    let memeScore = 0;

    tiles.forEach((tile) => {
      if (tile.celebrity) {
        memeScore += 0.3; // Celebrities are inherently more meme-worthy
      }

      if (tile.confidence > 0.8) {
        memeScore += 0.2; // High-quality tiles are more meme-worthy
      }
    });

    return Math.min(memeScore / tiles.length, 1);
  }

  private generateTileId(): string {
    return 'tile_' + Math.random().toString(36).substr(2, 9);
  }
}
