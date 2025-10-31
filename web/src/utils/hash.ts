/**
 * FlowScript Content Hashing (Browser-Compatible)
 * Session 7b.2.5.2: Phase 3 - Direct IR Rendering
 *
 * Generates deterministic SHA-256 content hashes for nodes, relationships, and states.
 * Enables automatic deduplication: same semantic content = same ID.
 *
 * Browser implementation using Web Crypto API (crypto.subtle).
 * Functionally identical to Node.js version (src/hash.ts).
 *
 * NOTE: Copied and adapted from /src/hash.ts
 * TODO (Phase 8): Refactor to shared monorepo package
 */

/**
 * Generate a SHA-256 content hash for any data object.
 *
 * The hash is deterministic - same input always produces same hash.
 * This enables automatic deduplication in the IR graph.
 *
 * @param data - Any object to hash
 * @returns 64-character lowercase hex string (SHA-256 hash)
 *
 * @example
 * hashContent({ type: 'statement', content: 'Test' })
 * // => 'a7f2c8d1b4e9f6a3c5d8e2b7f1a4c9d6e3b8a2f7c1d5e9b4a8f2c6d1e5a9b3f7'
 */
export async function hashContent(data: any): Promise<string> {
  // Normalize: sort object keys for deterministic JSON
  const normalized = JSON.stringify(data, Object.keys(data).sort());

  // Convert string to Uint8Array (required by crypto.subtle)
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(normalized);

  // Generate SHA-256 hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Return lowercase hex (64 chars)
  return hashHex;
}

/**
 * Synchronous hash function for use in semantic actions.
 * Uses a simple deterministic hash algorithm instead of SHA-256.
 *
 * NOTE: This produces different hashes than the async version,
 * but maintains determinism (same input = same hash).
 *
 * Use this during parsing when async is not practical.
 * For production IR storage, prefer the async hashContent() above.
 */
export function hashContentSync(data: any): string {
  // Normalize: sort object keys for deterministic JSON
  const normalized = JSON.stringify(data, Object.keys(data).sort());

  // Simple but deterministic hash (DJB2 algorithm)
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) + normalized.charCodeAt(i); // hash * 33 + c
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to unsigned 32-bit hex (8 chars) and pad to 64 chars for consistency
  // Repeat pattern to match SHA-256 length (not cryptographically secure, but deterministic)
  const baseHex = (hash >>> 0).toString(16).padStart(8, '0');
  return baseHex.repeat(8); // 8 * 8 = 64 characters
}
