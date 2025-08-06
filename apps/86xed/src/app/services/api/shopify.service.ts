import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';

import { ShopifyProduct } from '../../types/index';

export interface CreateProductRequest {
  title: string;
  description: string;
  images: string[];
  tags: string[];
  metafields: Record<string, string>;
}

export interface ShopifyProductResponse {
  id: string;
  title: string;
  handle: string;
  description: string;
  vendor: string;
  product_type: string;
  tags: string;
  variants: Array<{
    id: string;
    title: string;
    price: string;
    sku: string;
    inventory_quantity: number;
  }>;
  images: Array<{
    id: string;
    src: string;
    alt: string;
  }>;
  metafields: Array<{
    key: string;
    value: string;
    namespace: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
}

export interface ShopifyOrder {
  id: string;
  total_price: string;
  line_items: Array<{
    product_id: string;
    quantity: number;
    price: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ShopifyService {
  private readonly shopifyApiUrl = 'YOUR_SHOPIFY_STORE.myshopify.com/admin/api/2023-10';
  private readonly accessToken = 'YOUR_SHOPIFY_ACCESS_TOKEN';
  private http = inject(HttpClient);

  /**
   * Create a new product in Shopify from a viral bingo grid
   */
  async createProduct(productData: CreateProductRequest): Promise<ShopifyProduct> {
    const shopifyProduct = {
      product: {
        title: productData.title,
        body_html: this.formatDescription(productData.description),
        vendor: '86xed',
        product_type: 'Bingo Grid',
        tags: productData.tags.join(','),
        variants: [
          {
            option1: 'Default Title',
            price: '19.99',
            inventory_quantity: 1000,
            inventory_management: 'shopify'
          }
        ],
        images: productData.images.map(url => ({ src: url })),
        metafields: Object.entries(productData.metafields).map(([key, value]) => ({
          key,
          value,
          namespace: '86xed',
          type: 'single_line_text_field'
        }))
      }
    };

    try {
      const response = await this.http.post<{ product: ShopifyProductResponse }>(
        `https://${this.shopifyApiUrl}/products.json`,
        shopifyProduct,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      ).toPromise();

      if (!response?.product) {
        throw new Error('Failed to create Shopify product');
      }

      return this.mapShopifyProduct(response.product);
    } catch (error) {
      console.error('❌ Shopify product creation failed:', error);
      throw error;
    }
  }

  /**
   * Get product by Grid ID from metafields
   */
  async getProductByGridId(gridId: string): Promise<ShopifyProduct | null> {
    try {
      const response = await this.http.get<{ products: ShopifyProductResponse[] }>(
        `https://${this.shopifyApiUrl}/products.json?metafield[namespace]=86xed&metafield[key]=gridId&metafield[value]=${gridId}`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken
          }
        }
      ).toPromise();

      const product = response?.products?.[0];
      return product ? this.mapShopifyProduct(product) : null;
    } catch (error) {
      console.error('❌ Failed to get Shopify product:', error);
      return null;
    }
  }

  /**
   * Update product inventory when orders come in
   */
  async updateProductInventory(productId: string, quantity: number): Promise<void> {
    try {
      // Get the variant ID first
      const product = await this.getProduct(productId);
      const variantId = product.variants[0]?.id;

      if (!variantId) {
        throw new Error('No variant found for product');
      }

      await this.http.put(
        `https://${this.shopifyApiUrl}/variants/${variantId}.json`,
        {
          variant: {
            id: variantId,
            inventory_quantity: quantity
          }
        },
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      ).toPromise();

      console.log('✅ Updated inventory for product:', productId);
    } catch (error) {
      console.error('❌ Failed to update inventory:', error);
      throw error;
    }
  }

  /**
   * Get product sales data
   */
  getProductAnalytics(productId: string): Observable<{
    totalSales: number;
    revenue: number;
    conversionRate: number;
  }> {
    return from(this.fetchProductAnalytics(productId));
  }

  /**
   * Create product collection for viral grids
   */
  async createViralCollection(): Promise<void> {
    const collection = {
      custom_collection: {
        title: 'Viral Bingo Grids',
        body_html: 'The hottest viral bingo grids from the 86xed community',
        sort_order: 'best-selling',
        published: true
      }
    };

    try {
      await this.http.post(
        `https://${this.shopifyApiUrl}/custom_collections.json`,
        collection,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      ).toPromise();

      console.log('✅ Created viral collection');
    } catch (error) {
      console.error('❌ Failed to create collection:', error);
      throw error;
    }
  }

  /**
   * Add product to viral collection
   */
  async addToViralCollection(productId: string): Promise<void> {
    try {
      // First get the collection ID
      const collections = await this.http.get<{ custom_collections: ShopifyCollection[] }>(
        `https://${this.shopifyApiUrl}/custom_collections.json?title=Viral Bingo Grids`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken
          }
        }
      ).toPromise();

      const collectionId = collections?.custom_collections[0]?.id;

      if (!collectionId) {
        await this.createViralCollection();
        return this.addToViralCollection(productId); // Retry after creating
      }

      // Add product to collection
      await this.http.post(
        `https://${this.shopifyApiUrl}/collects.json`,
        {
          collect: {
            product_id: productId,
            collection_id: collectionId
          }
        },
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken,
            'Content-Type': 'application/json'
          }
        }
      ).toPromise();

      console.log('✅ Added product to viral collection:', productId);
    } catch (error) {
      console.error('❌ Failed to add to collection:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async getProduct(productId: string): Promise<ShopifyProductResponse> {
    const response = await this.http.get<{ product: ShopifyProductResponse }>(
      `https://${this.shopifyApiUrl}/products/${productId}.json`,
      {
        headers: {
          'X-Shopify-Access-Token': this.accessToken
        }
      }
    ).toPromise();

    if (!response?.product) {
      throw new Error('Product not found');
    }

    return response.product;
  }

  private async fetchProductAnalytics(productId: string): Promise<{
    totalSales: number;
    revenue: number;
    conversionRate: number;
  }> {
    try {
      // Get order line items for this product
      const orders = await this.http.get<{ orders: ShopifyOrder[] }>(
        `https://${this.shopifyApiUrl}/orders.json?status=any&product_id=${productId}`,
        {
          headers: {
            'X-Shopify-Access-Token': this.accessToken
          }
        }
      ).toPromise();

      const totalSales = orders?.orders?.length || 0;
      const revenue = orders?.orders?.reduce((sum, order) => 
        sum + parseFloat(order.total_price), 0) || 0;

      // Simplified conversion rate calculation
      const conversionRate = totalSales > 0 ? 0.02 : 0; // 2% baseline

      return { totalSales, revenue, conversionRate };
    } catch (error) {
      console.error('❌ Failed to fetch analytics:', error);
      return { totalSales: 0, revenue: 0, conversionRate: 0 };
    }
  }

  private formatDescription(description: string): string {
    return `
      <div class="bingo-grid-description">
        <h3>🎯 Viral Bingo Grid</h3>
        <p>${description}</p>
        <ul>
          <li>✨ AI-Enhanced Design</li>
          <li>🎨 High-Quality Print Ready</li>
          <li>📱 Perfect for Social Sharing</li>
          <li>🔥 From the 86xed Community</li>
        </ul>
        <p><strong>Created with 86xed - The viral bingo creator platform</strong></p>
      </div>
    `;
  }

  private mapShopifyProduct(shopifyProduct: ShopifyProductResponse): ShopifyProduct {
    return {
      id: shopifyProduct.id,
      title: shopifyProduct.title,
      description: shopifyProduct.description,
      url: `https://YOUR_STORE.myshopify.com/products/${shopifyProduct.handle}`,
      images: shopifyProduct.images.map(img => img.src)
    };
  }
}
