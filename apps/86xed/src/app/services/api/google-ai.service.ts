import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Face } from '../../types/index';

export interface GoogleVisionResponse {
  responses: Array<{
    faceAnnotations?: Array<{
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
  providedIn: 'root'
})
export class GoogleAIService {
  private readonly apiKey = 'YOUR_GOOGLE_VISION_API_KEY';
  private readonly visionApiUrl = 'https://vision.googleapis.com/v1/images:annotate';
  private http = inject(HttpClient);

  /**
   * Detect celebrities and enhance face data with AI
   */
  async detectCelebrities(faces: Partial<Face>[]): Promise<Face[]> {
    const enhancedFaces: Face[] = [];

    for (const face of faces) {
      try {
        console.log('🤖 Processing face with Google Vision AI...');
        
        if (!face.imageUrl) {
          console.warn('⚠️ Face missing image URL, skipping AI enhancement');
          continue;
        }

        // Detect faces and celebrities
        const visionResult = await this.analyzeImage(face.imageUrl);
        const celebrityData = await this.identifyCelebrity(face.imageUrl);

        const enhancedFace: Face = {
          id: face.id || this.generateFaceId(),
          imageUrl: face.imageUrl,
          name: celebrityData?.name || face.name || 'Unknown',
          celebrity: !!celebrityData,
          confidence: celebrityData?.confidence || this.calculateFaceQuality(visionResult),
          position: face.position || { x: 0, y: 0 },
          metadata: {
            aiDetected: true,
            verified: !!celebrityData,
            source: celebrityData ? 'google-knowledge-graph' : 'user-upload'
          }
        };

        enhancedFaces.push(enhancedFace);
        console.log(`✅ Enhanced face: ${enhancedFace.name} (${enhancedFace.confidence}% confidence)`);
      } catch (error) {
        console.error('❌ Face enhancement failed:', error);
        
        // Fallback: create basic face object
        const basicFace: Face = {
          id: face.id || this.generateFaceId(),
          imageUrl: face.imageUrl || '',
          name: face.name || 'Unknown',
          celebrity: false,
          confidence: 0.5,
          position: face.position || { x: 0, y: 0 },
          metadata: {
            aiDetected: false,
            verified: false,
            source: 'user-upload'
          }
        };
        
        enhancedFaces.push(basicFace);
      }
    }

    return enhancedFaces;
  }

  /**
   * Analyze image quality and face detection
   */
  async analyzeImage(imageUrl: string): Promise<GoogleVisionResponse> {
    const requestBody = {
      requests: [
        {
          image: {
            source: {
              imageUri: imageUrl
            }
          },
          features: [
            {
              type: 'FACE_DETECTION',
              maxResults: 10
            },
            {
              type: 'WEB_DETECTION',
              maxResults: 20
            }
          ]
        }
      ]
    };

    const response = await this.http.post<GoogleVisionResponse>(
      `${this.visionApiUrl}?key=${this.apiKey}`,
      requestBody
    ).toPromise();

    if (!response) {
      throw new Error('Failed to analyze image with Google Vision');
    }

    return response;
  }

  /**
   * Identify if the face belongs to a celebrity
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
        .filter(entity => 
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
        description: `Celebrity detected with ${Math.round(topEntity.score * 100)}% confidence`
      };
    } catch (error) {
      console.error('❌ Celebrity identification failed:', error);
      return null;
    }
  }

  /**
   * Generate meme text suggestions based on detected faces
   */
  async generateMemeText(faces: Face[]): Promise<string[]> {
    const suggestions: string[] = [];

    for (const face of faces) {
      if (face.celebrity && face.name !== 'Unknown') {
        // Generate celebrity-specific meme text
        suggestions.push(
          `When ${face.name} sees your bingo card`,
          `${face.name} approves this bingo`,
          `POV: You're ${face.name} playing bingo`,
          `${face.name} when someone gets bingo before them`
        );
      } else {
        // Generate generic meme text
        suggestions.push(
          'When you get bingo first',
          'That face when you almost win',
          'POV: You\'re one square away from bingo',
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
   * Analyze viral potential based on face composition
   */
  calculateViralScore(faces: Face[]): number {
    let score = 0;

    // Celebrity bonus
    const celebrityCount = faces.filter(f => f.celebrity).length;
    score += celebrityCount * 0.3;

    // Face quality bonus
    const avgQuality = faces.reduce((sum, f) => sum + f.confidence, 0) / faces.length;
    score += avgQuality * 0.3;

    // Diversity bonus (different types of faces)
    const diversity = this.calculateFaceDiversity(faces);
    score += diversity * 0.2;

    // Meme potential bonus
    const memeScore = this.calculateMemeScore(faces);
    score += memeScore * 0.2;

    return Math.min(score, 1);
  }

  /**
   * Private helper methods
   */
  private calculateFaceQuality(visionResult: GoogleVisionResponse): number {
    const faceAnnotations = visionResult.responses[0]?.faceAnnotations;
    
    if (!faceAnnotations || faceAnnotations.length === 0) {
      return 0.5; // Default confidence
    }

    // Use detection confidence and quality indicators
    const face = faceAnnotations[0];
    let quality = face.detectionConfidence;

    // Reduce quality for blurred or poorly lit images
    if (face.blurredLikelihood === 'LIKELY' || face.blurredLikelihood === 'VERY_LIKELY') {
      quality *= 0.7;
    }
    
    if (face.underExposedLikelihood === 'LIKELY' || face.underExposedLikelihood === 'VERY_LIKELY') {
      quality *= 0.8;
    }

    return Math.round(quality * 100) / 100;
  }

  private isCelebrityDescription(description: string): boolean {
    const celebrityKeywords = [
      'actor', 'actress', 'singer', 'musician', 'artist', 'celebrity',
      'performer', 'entertainer', 'comedian', 'director', 'producer',
      'influencer', 'personality', 'star', 'famous'
    ];

    const lowerDesc = description.toLowerCase();
    return celebrityKeywords.some(keyword => lowerDesc.includes(keyword));
  }

  private calculateFaceDiversity(faces: Face[]): number {
    // Simple diversity calculation based on celebrity vs non-celebrity mix
    const celebrityCount = faces.filter(f => f.celebrity).length;
    const nonCelebrityCount = faces.length - celebrityCount;
    
    if (faces.length <= 1) return 0;
    
    // Best diversity is a mix of both types
    const ratio = Math.min(celebrityCount, nonCelebrityCount) / faces.length;
    return ratio * 2; // Scale to 0-1 range
  }

  private calculateMemeScore(faces: Face[]): number {
    // Faces with expressive features or recognizable personalities score higher
    let memeScore = 0;
    
    faces.forEach(face => {
      if (face.celebrity) {
        memeScore += 0.3; // Celebrities are inherently more meme-worthy
      }
      
      if (face.confidence > 0.8) {
        memeScore += 0.2; // High-quality faces are more meme-worthy
      }
    });

    return Math.min(memeScore / faces.length, 1);
  }

  private generateFaceId(): string {
    return 'face_' + Math.random().toString(36).substr(2, 9);
  }
}
