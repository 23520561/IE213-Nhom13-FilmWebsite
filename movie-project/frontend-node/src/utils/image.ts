/**
 * Utilities for optimizing resource and image loading performance.
 */

/**
 * Appends Unsplash dynamic resizing parameters for precise sizing and format optimization (e.g., WebP).
 * This significantly reduces page payload and speeds up images loading in grids.
 * 
 * @param url The initial image URL
 * @param width The target width in pixels
 * @param quality The quality compression level (default 75)
 */
export function getOptimizedImageUrl(url: string, width: number, quality = 75): string {
  if (!url) return '';
  
  if (url.includes('images.unsplash.com')) {
    try {
      const baseUrl = url.split('?')[0];
      return `${baseUrl}?auto=format&fit=crop&w=${width}&q=${quality}&fm=webp`;
    } catch {
      return url;
    }
  }
  return url;
}
