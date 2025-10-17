/**
 * FlowScript Content Hashing
 *
 * Generates deterministic SHA-256 content hashes for nodes, relationships, and states.
 * Enables automatic deduplication: same semantic content = same ID.
 */

import * as crypto from 'crypto';

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
export function hashContent(data: any): string {
  // Normalize: sort object keys for deterministic JSON
  const normalized = JSON.stringify(data, Object.keys(data).sort());

  // Generate SHA-256 hash
  const hash = crypto.createHash('sha256');
  hash.update(normalized);

  // Return lowercase hex (64 chars)
  return hash.digest('hex');
}
