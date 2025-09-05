import { inject, Injectable } from '@angular/core';
import { combineLatest, from, Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { BingoGrid, GridInput, ShopifyProduct, SocialMetrics, Tile } from '../../types';
import { GoogleAIService } from '../api/google-ai.service';
import { ShopifyService } from '../api/shopify.service';
import { SupabaseService } from '../api/supabase.service';
import { RealtimeService } from './realtime.service';
import { SocialDistributionService } from './social-distribution.service';

@Injectable({
  providedIn: 'root',
})
export class OrchestrationService {
  private supabase: SupabaseService;
  private shopify: ShopifyService;
  private googleAI: GoogleAIService;
  private socialDistribution: SocialDistributionService;
  private realtime: RealtimeService;

  private readonly VIRAL_THRESHOLD = 0.8;
  private readonly ENGAGEMENT_THRESHOLD = 100;

  constructor() {
    this.supabase = inject(SupabaseService);
    this.shopify = inject(ShopifyService);
    this.googleAI = inject(GoogleAIService);
    this.socialDistribution = inject(SocialDistributionService);
    this.realtime = inject(RealtimeService);
  }

  /**
   * Complete viral grid creation workflow
   * Orchestrates: AI enhancement → Social storage → Real-time updates → Viral detection → Monetization
   */
  createViralGrid(gridInput: GridInput): Observable<BingoGrid> {
    return from(this.processGridCreation(gridInput));
  }

  /**
   * Convert successful grid to commerce product
   * Orchestrates: Print generation → Shopify product → Social updates → Cross-platform sharing
   */
  monetizeGrid(
    gridId: string
  ): Observable<{ grid: BingoGrid; productUrl: string }> {
    return from(this.processGridMonetization(gridId));
  }

  /**
   * Real-time viral detection and auto-monetization
   * Monitors: Engagement metrics → Viral threshold → Auto-commerce creation
   */
  monitorViralPotential(gridId: string): Observable<BingoGrid> {
    return this.realtime.subscribeToGridMetrics(gridId).pipe(
      switchMap((metrics) => this.evaluateViralPotential(gridId, metrics)),
      tap((grid) => this.handleViralDetection(grid))
    );
  }

  /**
   * Cross-service data synchronization
   * Ensures: Supabase ↔ Shopify ↔ Social platforms data consistency
   */
  syncGridAcrossServices(gridId: string): Observable<BingoGrid> {
    return combineLatest([
      this.supabase.getGrid(gridId),
      this.shopify.getProductByGridId(gridId),
      this.socialDistribution.getMetrics(gridId),
    ]).pipe(
      map(([gridData, productData, socialMetrics]) =>
        this.mergeServiceData(gridData, productData, socialMetrics)
      )
    );
  }

  private async processGridCreation(gridInput: GridInput): Promise<BingoGrid> {
    try {
      // 1. AI Enhancement
      console.log('🤖 Enhancing tiles with Google AI...');
      const enhancedTiles = await this.googleAI.detectCelebrities(
        gridInput.tiles
      );

      // 2. Create grid object
      const gridData: Partial<BingoGrid> = {
        ...gridInput,
        tiles: enhancedTiles,
        viralScore: this.calculateInitialViralScore(enhancedTiles),
        engagementScore: 0,
        status: 'draft',
        metadata: {
          tags: gridInput.tags,
          categories: this.categorizeTiles(enhancedTiles),
          aiEnhanced: true,
          printReady: false,
        },
        socialMetrics: {
          shares: 0,
          likes: 0,
          comments: 0,
          saves: 0,
        },
      };

      // 3. Save to Supabase
      console.log('💾 Saving grid to Supabase...');
      const savedGrid = await this.supabase.saveGrid(gridData);

      // 4. Real-time broadcast
      console.log('📡 Broadcasting new grid creation...');
      this.realtime.broadcastNewGrid(savedGrid);

      // 5. Check for immediate viral potential
      if (savedGrid.viralScore > this.VIRAL_THRESHOLD) {
        console.log(
          '🚀 High viral potential detected, preparing for monetization...'
        );
        // Trigger async monetization process
        this.monetizeGrid(savedGrid.id).subscribe();
      }

      return savedGrid;
    } catch (error) {
      console.error('❌ Grid creation failed:', error);
      throw error;
    }
  }

  private async processGridMonetization(
    gridId: string
  ): Promise<{ grid: BingoGrid; productUrl: string }> {
    try {
      // 1. Get current grid data
      const grid = await this.supabase.getGrid(gridId).toPromise();
      if (!grid) throw new Error('Grid not found');

      // 2. Generate print-ready file
      console.log('🖨️ Generating print-ready files...');
      const printFile = await this.generatePrintFile(grid);

      // 3. Create Shopify product
      console.log('🛍️ Creating Shopify product...');
      const product = await this.shopify.createProduct({
        title: grid.title,
        description: grid.description,
        images: [printFile],
        tags: grid.metadata.tags,
        metafields: {
          gridId: grid.id,
          viralScore: grid.viralScore.toString(),
          aiEnhanced: grid.metadata.aiEnhanced.toString(),
        },
      });

      // 4. Update grid with product info
      const updatedGrid = await this.supabase.updateGrid(grid.id, {
        shopifyProductId: product.id,
        status: 'monetized',
        'metadata.printReady': true,
      });

      // 5. Cross-platform social distribution
      console.log('🌐 Distributing to social platforms...');
      await this.socialDistribution.shareToAllPlatforms(
        updatedGrid,
        product.url
      );

      // 6. Real-time notification
      this.realtime.broadcastGridMonetized(updatedGrid);

      return { grid: updatedGrid, productUrl: product.url };
    } catch (error) {
      console.error('❌ Grid monetization failed:', error);
      throw error;
    }
  }

  private async evaluateViralPotential(
    gridId: string,
    metrics: SocialMetrics
  ): Promise<BingoGrid> {
    const grid = await this.supabase.getGrid(gridId).toPromise();
    if (!grid) throw new Error('Grid not found');

    // Calculate engagement score based on real-time metrics
    const engagementScore = this.calculateEngagementScore(metrics);

    // Update grid with new metrics
    return this.supabase.updateGrid(gridId, {
      engagementScore,
      socialMetrics: metrics,
      viralScore: this.recalculateViralScore(grid, metrics),
    });
  }

  private async handleViralDetection(grid: BingoGrid): Promise<void> {
    if (
      grid.viralScore > this.VIRAL_THRESHOLD &&
      grid.engagementScore > this.ENGAGEMENT_THRESHOLD &&
      grid.status !== 'monetized'
    ) {
      console.log('🔥 Viral content detected! Auto-monetizing...', grid.title);

      // Trigger auto-monetization
      this.monetizeGrid(grid.id).subscribe({
        next: (result) =>
          console.log('💰 Auto-monetization successful:', result.productUrl),
        error: (error) => console.error('❌ Auto-monetization failed:', error),
      });
    }
  }

  private calculateInitialViralScore(tiles: Tile[]): number {
    // Calculate based on celebrity count, tile quality, AI confidence
    const celebrityBonus = tiles.filter((f) => f.celebrity).length * 0.2;
    const qualityScore =
      tiles.reduce((sum, f) => sum + f.confidence, 0) / tiles.length;
    return Math.min(celebrityBonus + qualityScore, 1);
  }

  private calculateEngagementScore(metrics: SocialMetrics): number {
    const { shares, likes, comments, saves } = metrics;
    return shares * 4 + likes * 1 + comments * 3 + saves * 2;
  }

  private recalculateViralScore(
    grid: BingoGrid,
    metrics: SocialMetrics
  ): number {
    const baseScore = grid.viralScore;
    const engagementBonus = Math.min(metrics.shares * 0.1, 0.5);
    return Math.min(baseScore + engagementBonus, 1);
  }

  private categorizeTiles(tiles: Tile[]): string[] {
    const categories: string[] = [];
    if (tiles.some((f) => f.celebrity)) categories.push('celebrities');
    if (tiles.length > 5) categories.push('crowd');
    if (tiles.every((f) => f.confidence > 0.9)) categories.push('high-quality');
    return categories;
  }

  private async generatePrintFile(grid: BingoGrid): Promise<string> {
    // This would integrate with canvas/image processing
    // For now, return placeholder
    return `https://print-files.86xed.com/${grid.id}.png`;
  }

  private mergeServiceData(
    gridData: BingoGrid,
    productData: ShopifyProduct | null,
    socialMetrics: SocialMetrics | null
  ): BingoGrid {
    // Merge data from all services into consistent grid object
    return {
      ...gridData,
      shopifyProductId: productData?.id,
      socialMetrics: socialMetrics || gridData.socialMetrics,
    };
  }
}
