/**
 * AuditWriter — Hash-chained, append-only audit trail for FlowScript memory.
 *
 * Every memory management decision — consolidation reasoning, node mutations, prune
 * events, session lifecycle — is captured in a tamper-evident, rotatable JSONL log.
 *
 * Design:
 * - Append-only entries, rotatable files (entries never modified; files sealed + compressed)
 * - Write-first (crash-safe): audit entry written BEFORE the mutation it describes
 * - Hash-chained (tamper-evident): SHA256(previous_entry) → detectable tampering
 * - Monthly rotation with gzip compression + manifest index
 * - on_event callback for real-time integration (SIEM, Observatory)
 *
 * File layout:
 *     {stem}.audit.jsonl                    # active (hot) — appending
 *     {stem}.audit.2026-02.jsonl.gz         # sealed (compressed)
 *     {stem}.audit.manifest.json            # index (time ranges, counts, hashes)
 *
 * CRITICAL: JSON serialization must match Python's json.dumps(sort_keys=True, separators=(",",":"))
 * for cross-language chain verification. See canonicalStringify().
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

// =============================================================================
// Configuration
// =============================================================================

export interface AuditConfig {
  /** When to rotate audit files. Default: 'monthly'. */
  rotation?: 'monthly' | 'weekly' | 'daily' | 'none' | `size:${string}`;
  /** Compression for rotated files. Default: 'gzip'. */
  compression?: 'gzip' | 'none';
  /** How long to keep rotated files in months. Default: 84 (7 years, SOX). null = keep forever. */
  retentionMonths?: number | null;
  /** Whether to hash-chain entries. Default: true. */
  hashChain?: boolean;
  /** 'standard' (mutations only) or 'full' (mutations + reads). Default: 'standard'. */
  verbosity?: 'standard' | 'full';
  /**
   * Encryption at rest. 'none' (default) or 'aes-256-gcm'.
   * NOT YET IMPLEMENTED — v2 commitment for SOC2/enterprise compliance.
   * Setting to anything other than 'none' throws an error.
   */
  encryption?: 'none' | 'aes-256-gcm';
  /** Optional callback invoked for every audit entry. Callback failure never blocks audit persistence. */
  onEvent?: (entry: AuditEntry) => void;
}

/** Resolved config with defaults applied. */
interface ResolvedAuditConfig {
  rotation: string;
  compression: 'gzip' | 'none';
  retentionMonths: number | null;
  hashChain: boolean;
  verbosity: 'standard' | 'full';
  onEvent?: (entry: AuditEntry) => void;
}

// =============================================================================
// Entry & Result Types
// =============================================================================

/** Base audit entry — all events share this shape. */
export interface AuditEntry {
  v: number;
  seq: number;
  timestamp: string;
  event: string;
  prev_hash?: string;
  session_id: string | null;
  data: Record<string, unknown>;
  adapter: { framework: string; adapter_class: string; operation: string } | null;
}

export interface AuditQueryResult {
  entries: AuditEntry[];
  totalScanned: number;
  filesSearched: number;
  chainValid?: boolean;
  chainBreakAt?: number;
}

export interface AuditVerifyResult {
  valid: boolean;
  totalEntries: number;
  filesVerified: number;
  legacyEntries: number;
  chainBreakAt?: number;
  chainBreakFile?: string;
}

export interface AuditQueryOptions {
  after?: string;
  before?: string;
  events?: string[];
  nodeId?: string;
  sessionId?: string;
  adapter?: string;
  limit?: number;
  verifyChain?: boolean;
}

// =============================================================================
// Sentinels
// =============================================================================

export const GENESIS_HASH = 'sha256:GENESIS';
export const LEGACY_BRIDGE_HASH = 'sha256:LEGACY_BRIDGE';
export const SCHEMA_VERSION = 1;

// =============================================================================
// Canonical JSON
// =============================================================================

/**
 * Deterministic JSON serialization matching Python's json.dumps(sort_keys=True, separators=(",",":")).
 *
 * This is CRITICAL for cross-language hash chain verification. Python and TypeScript
 * must produce identical bytes for the same logical entry, or chain verification
 * across language boundaries will break.
 *
 * Rules:
 * - Keys sorted recursively at every level
 * - No whitespace (compact separators: "," and ":")
 * - null preserved as null
 * - Strings: non-ASCII chars escaped to \uXXXX (matches Python ensure_ascii=True)
 * - Numbers: integers as-is
 * - undefined object values serialized as null (matches Python None behavior;
 *   differs from JSON.stringify which omits undefined keys entirely)
 *
 * KNOWN LIMITATION — Float serialization:
 * JavaScript does not distinguish integer 1 from float 1.0 at the language level.
 * Python's json.dumps(1.0) → "1.0", but JS JSON.stringify(1.0) → "1".
 * Cross-language chain verification will break if data payloads contain Python
 * floats that serialize as "X.0". In practice this is low risk: audit entry
 * fields (v, seq, timestamps, event types, node content) are integers or strings.
 * If float-bearing data payloads are needed in the future, both implementations
 * must adopt RFC 8785 (JSON Canonicalization Scheme) for number serialization.
 */
export function canonicalStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return canonicalNumber(obj);
  if (typeof obj === 'string') return canonicalString(obj);

  if (Array.isArray(obj)) {
    const items = obj.map(item => canonicalStringify(item));
    return '[' + items.join(',') + ']';
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    const pairs = keys.map(key => {
      const val = (obj as Record<string, unknown>)[key];
      return canonicalString(key) + ':' + canonicalStringify(val);
    });
    return '{' + pairs.join(',') + '}';
  }

  return JSON.stringify(obj);
}

/**
 * Serialize a string matching Python's json.dumps with ensure_ascii=True.
 * All non-ASCII characters are escaped to \uXXXX sequences.
 * Control characters and special JSON characters are escaped per JSON spec.
 */
function canonicalString(s: string): string {
  let result = '"';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code === 0x22) { result += '\\"'; }        // "
    else if (code === 0x5C) { result += '\\\\'; }  // \
    else if (code === 0x08) { result += '\\b'; }    // backspace
    else if (code === 0x0C) { result += '\\f'; }    // form feed
    else if (code === 0x0A) { result += '\\n'; }    // newline
    else if (code === 0x0D) { result += '\\r'; }    // carriage return
    else if (code === 0x09) { result += '\\t'; }    // tab
    else if (code < 0x20) {
      // Other control characters
      result += '\\u' + code.toString(16).padStart(4, '0');
    } else if (code > 0x7E) {
      // Non-ASCII — escape to \uXXXX (matches Python ensure_ascii=True)
      // Handle surrogate pairs for characters outside BMP
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < s.length) {
        const next = s.charCodeAt(i + 1);
        if (next >= 0xDC00 && next <= 0xDFFF) {
          result += '\\u' + code.toString(16).padStart(4, '0');
          result += '\\u' + next.toString(16).padStart(4, '0');
          i++; // skip next char (already processed)
          continue;
        }
      }
      result += '\\u' + code.toString(16).padStart(4, '0');
    } else {
      result += s[i];
    }
  }
  result += '"';
  return result;
}

/**
 * Serialize a number matching Python's json.dumps output.
 * Python: 1.0 → "1.0", 1e20 → "1e+20", 1e-7 → "1e-07"
 * JS default differs. We match Python's behavior.
 */
function canonicalNumber(n: number): string {
  if (!isFinite(n)) return 'null'; // JSON spec: Infinity/NaN → null

  // Integer check: if it's a whole number and not expressed in scientific notation
  if (Number.isInteger(n) && Math.abs(n) < 1e16) {
    return n.toString();
  }

  // For floats, match Python's repr:
  // Python uses repr() which gives minimal digits for round-trip
  // For most practical audit data (timestamps are strings, seqs are ints),
  // this path is rare. Use JSON.stringify as baseline.
  const jsStr = JSON.stringify(n);

  // Python always includes decimal point for floats: 1.0 not 1
  // But we already handled integers above, so this is for actual floats
  return jsStr;
}

// =============================================================================
// AuditWriter
// =============================================================================

export class AuditWriter {
  private _memoryPath: string;
  private _config: ResolvedAuditConfig;
  private _activePath: string;
  private _manifestPath: string;
  private _seq: number = 0;
  private _prevHash: string = GENESIS_HASH;
  private _currentPeriod: string = '';
  private _initialized: boolean = false;
  private _inCleanup: boolean = false;
  private _rotationCounter: number = 0;

  constructor(memoryPath: string, config?: AuditConfig) {
    if (config?.encryption && config.encryption !== 'none') {
      throw new Error(
        `Encryption at rest ('${config.encryption}') is not yet implemented. ` +
        "This is a documented v2 commitment. Currently only 'none' is supported."
      );
    }
    this._memoryPath = memoryPath;
    this._config = {
      rotation: config?.rotation ?? 'monthly',
      compression: config?.compression ?? 'gzip',
      retentionMonths: config?.retentionMonths === undefined ? 84 : config.retentionMonths,
      hashChain: config?.hashChain ?? true,
      verbosity: config?.verbosity ?? 'standard',
      onEvent: config?.onEvent,
    };
    this._activePath = AuditWriter._deriveActivePath(memoryPath);
    this._manifestPath = AuditWriter._deriveManifestPath(memoryPath);
  }

  // -------------------------------------------------------------------------
  // Path derivation
  // -------------------------------------------------------------------------

  static _deriveActivePath(memoryPath: string): string {
    const ext = path.extname(memoryPath);
    const stem = ext ? memoryPath.slice(0, -ext.length) : memoryPath;
    return stem + '.audit.jsonl';
  }

  static _deriveManifestPath(memoryPath: string): string {
    const ext = path.extname(memoryPath);
    const stem = ext ? memoryPath.slice(0, -ext.length) : memoryPath;
    return stem + '.audit.manifest.json';
  }

  private static _periodForTime(dt: Date, rotation: string): string {
    if (rotation === 'daily') {
      return dt.toISOString().slice(0, 10); // YYYY-MM-DD
    }
    if (rotation === 'weekly') {
      const year = dt.getUTCFullYear();
      // ISO week calculation
      const jan1 = new Date(Date.UTC(year, 0, 1));
      const daysSinceJan1 = Math.floor((dt.getTime() - jan1.getTime()) / 86400000);
      const week = Math.floor(daysSinceJan1 / 7);
      return `${year}-W${String(week).padStart(2, '0')}`;
    }
    if (rotation === 'monthly') {
      return dt.toISOString().slice(0, 7); // YYYY-MM
    }
    return ''; // 'none' or size-based
  }

  private _rotatedFilename(period: string): string {
    const ext = path.extname(this._memoryPath);
    const stem = ext ? path.basename(this._memoryPath, ext) : path.basename(this._memoryPath);
    const suffix = this._config.compression === 'gzip' ? '.jsonl.gz' : '.jsonl';
    return `${stem}.audit.${period}${suffix}`;
  }

  // -------------------------------------------------------------------------
  // Initialization (lazy — on first write)
  // -------------------------------------------------------------------------

  private _initialize(): void {
    if (this._initialized) return;

    const now = new Date();
    this._currentPeriod = AuditWriter._periodForTime(now, this._config.rotation);

    // If active file exists, recover seq and prev_hash from last entry
    if (fs.existsSync(this._activePath)) {
      const lastLine = AuditWriter._readLastLine(this._activePath);
      if (lastLine) {
        try {
          const lastEntry = JSON.parse(lastLine);
          this._seq = (lastEntry.seq ?? 0) + 1;
          if (this._config.hashChain) {
            if ('prev_hash' in lastEntry) {
              // Last entry is chained — compute hash from it for chain continuity
              this._prevHash = AuditWriter._computeHash(lastLine);
            } else {
              // Last entry is legacy (no prev_hash) — bridge from it
              this._prevHash = LEGACY_BRIDGE_HASH;
            }
          }
        } catch {
          // Corrupt last line — start fresh chain from legacy bridge
          this._seq = 0;
          this._prevHash = LEGACY_BRIDGE_HASH;
        }
      } else {
        // Empty file — fresh start
        this._seq = 0;
        this._prevHash = GENESIS_HASH;
      }
    } else {
      // Fresh file
      this._seq = 0;
      this._prevHash = GENESIS_HASH;
    }

    // Load manifest if exists — chain from last sealed file if active is fresh
    if (fs.existsSync(this._manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(this._manifestPath, 'utf-8'));
        if (!fs.existsSync(this._activePath) && manifest.files?.length) {
          const lastFile = manifest.files[manifest.files.length - 1];
          this._prevHash = lastFile.last_hash ?? GENESIS_HASH;
        }
      } catch {
        // ignore
      }
    }

    this._initialized = true;
  }

  private static _readLastLine(filePath: string): string {
    try {
      // Read backwards from end of file to find last non-empty line.
      // Avoids loading entire file into memory (OOM risk on multi-GB audit files).
      const fd = fs.openSync(filePath, 'r');
      try {
        const stat = fs.fstatSync(fd);
        if (stat.size === 0) return '';

        // Read last 8KB (more than enough for one JSONL line)
        const readSize = Math.min(8192, stat.size);
        const buf = Buffer.alloc(readSize);
        fs.readSync(fd, buf, 0, readSize, stat.size - readSize);
        const chunk = buf.toString('utf-8');
        const lines = chunk.split('\n').filter(l => l.trim());
        return lines.length > 0 ? lines[lines.length - 1].trim() : '';
      } finally {
        fs.closeSync(fd);
      }
    } catch {
      return '';
    }
  }

  private static _readFirstLine(filePath: string): string {
    try {
      // Read only the first 8KB (more than enough for one JSONL line).
      // Mirrors _readLastLine's bounded approach to avoid OOM on large files.
      const fd = fs.openSync(filePath, 'r');
      try {
        const stat = fs.fstatSync(fd);
        if (stat.size === 0) return '';
        const readSize = Math.min(8192, stat.size);
        const buf = Buffer.alloc(readSize);
        fs.readSync(fd, buf, 0, readSize, 0);
        const chunk = buf.toString('utf-8');
        const lines = chunk.split('\n').filter(l => l.trim());
        return lines.length > 0 ? lines[0].trim() : '';
      } finally {
        fs.closeSync(fd);
      }
    } catch {
      return '';
    }
  }

  // -------------------------------------------------------------------------
  // Hash computation
  // -------------------------------------------------------------------------

  static _computeHash(jsonLine: string): string {
    return 'sha256:' + crypto.createHash('sha256').update(jsonLine.trim(), 'utf-8').digest('hex');
  }

  // -------------------------------------------------------------------------
  // Write
  // -------------------------------------------------------------------------

  write(
    event: string,
    data: Record<string, unknown>,
    sessionId?: string | null,
    adapter?: { framework: string; adapter_class: string; operation: string } | null,
  ): AuditEntry {
    this._initialize();

    const now = new Date();
    const currentPeriod = AuditWriter._periodForTime(now, this._config.rotation);

    // Check time-based rotation
    if (
      this._config.rotation !== 'none' &&
      !this._config.rotation.startsWith('size:') &&
      this._currentPeriod &&
      currentPeriod !== this._currentPeriod &&
      fs.existsSync(this._activePath) &&
      fs.statSync(this._activePath).size > 0
    ) {
      this._rotate(this._currentPeriod);
      this._currentPeriod = currentPeriod;
    }

    // Size-based rotation check
    if (this._config.rotation.startsWith('size:')) {
      const maxBytes = AuditWriter._parseSize(this._config.rotation);
      if (fs.existsSync(this._activePath) && fs.statSync(this._activePath).size >= maxBytes) {
        this._rotationCounter++;
        const period = now.toISOString().replace(/[:.]/g, '').slice(0, 19) + '-' + this._rotationCounter;
        this._rotate(period);
      }
    }

    this._currentPeriod = currentPeriod;

    // Build entry
    const entry: AuditEntry = {
      v: SCHEMA_VERSION,
      seq: this._seq,
      timestamp: now.toISOString(),
      event,
      session_id: sessionId ?? null,
      data,
      adapter: adapter ?? null,
    };

    if (this._config.hashChain) {
      entry.prev_hash = this._prevHash;
    }

    // Serialize deterministically (sorted keys for stable hashing)
    const jsonLine = canonicalStringify(entry);

    // Write to file (append-only, fsync for crash safety)
    const dir = path.dirname(this._activePath);
    if (dir && dir !== '.') {
      fs.mkdirSync(dir, { recursive: true });
    }
    const fd = fs.openSync(this._activePath, 'a');
    try {
      fs.writeSync(fd, jsonLine + '\n', undefined, 'utf-8');
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }

    // Update state for next entry
    if (this._config.hashChain) {
      this._prevHash = AuditWriter._computeHash(jsonLine);
    }
    this._seq += 1;

    // Update manifest active state (periodic, not every write)
    this._updateManifestActive(entry);

    // Fire on_event callback (failure must never block audit, but log to stderr)
    if (this._config.onEvent) {
      try {
        this._config.onEvent(entry);
      } catch (e) {
        process.stderr.write(`AuditWriter: onEvent callback failed: ${e}\n`);
      }
    }

    return entry;
  }

  private static _parseSize(sizeStr: string): number {
    const raw = sizeStr.replace('size:', '').trim().toUpperCase();
    const multipliers: Record<string, number> = {
      'GB': 1024 ** 3,
      'MB': 1024 ** 2,
      'KB': 1024,
      'B': 1,
    };
    for (const [suffix, mult] of Object.entries(multipliers).sort((a, b) => b[0].length - a[0].length)) {
      if (raw.endsWith(suffix)) {
        return parseInt(raw.slice(0, -suffix.length), 10) * mult;
      }
    }
    return parseInt(raw, 10);
  }

  // -------------------------------------------------------------------------
  // Rotation
  // -------------------------------------------------------------------------

  private _rotate(period: string): void {
    if (!fs.existsSync(this._activePath) || fs.statSync(this._activePath).size === 0) {
      return;
    }

    // Read metadata from active file before sealing
    const firstLine = AuditWriter._readFirstLine(this._activePath);
    const lastLine = AuditWriter._readLastLine(this._activePath);
    const content = fs.readFileSync(this._activePath, 'utf-8');
    const entryCount = content.split('\n').filter(l => l.trim()).length;

    let firstTs = '';
    let lastTs = '';
    let firstHash = GENESIS_HASH;
    let lastHash = '';
    try {
      if (firstLine) {
        const fe = JSON.parse(firstLine);
        firstTs = fe.timestamp ?? '';
        firstHash = fe.prev_hash ?? GENESIS_HASH;
      }
      if (lastLine) {
        lastHash = AuditWriter._computeHash(lastLine);
        const le = JSON.parse(lastLine);
        lastTs = le.timestamp ?? '';
      }
    } catch {
      // ignore parse errors
    }

    const rotatedName = this._rotatedFilename(period);
    const rotatedPath = path.join(path.dirname(this._activePath), rotatedName);
    let compressedSize: number;
    let uncompressedSize: number;
    let actualRotatedName = rotatedName;
    let actualRotatedPath = rotatedPath;

    if (this._config.compression === 'gzip') {
      uncompressedSize = fs.statSync(this._activePath).size;
      const uncompressed = fs.readFileSync(this._activePath);
      const compressed = zlib.gzipSync(uncompressed);
      fs.writeFileSync(rotatedPath, compressed);
      compressedSize = compressed.length;
      fs.unlinkSync(this._activePath);
    } else {
      const ext = path.extname(this._memoryPath);
      const stem = ext ? path.basename(this._memoryPath, ext) : path.basename(this._memoryPath);
      actualRotatedName = `${stem}.audit.${period}.jsonl`;
      actualRotatedPath = path.join(path.dirname(this._activePath), actualRotatedName);
      fs.renameSync(this._activePath, actualRotatedPath);
      uncompressedSize = fs.statSync(actualRotatedPath).size;
      compressedSize = uncompressedSize;
    }

    // Compute file hash for integrity
    const fileHash = AuditWriter._hashFile(actualRotatedPath);

    // Update manifest
    const fileEntry = {
      filename: actualRotatedName,
      period,
      entries: entryCount,
      first_timestamp: firstTs,
      last_timestamp: lastTs,
      first_hash: firstHash,
      last_hash: lastHash,
      size_bytes: compressedSize,
      uncompressed_bytes: uncompressedSize,
      sha256_file: fileHash,
    };
    this._addToManifest(fileEntry);

    // Retention cleanup
    this._cleanupRetention();

    // Reset seq for new file, chain continues
    this._seq = 0;
    // prev_hash stays as the last entry's hash (cross-file continuity)
  }

  private static _hashFile(filePath: string): string {
    const hash = crypto.createHash('sha256');
    const content = fs.readFileSync(filePath);
    hash.update(content);
    return 'sha256:' + hash.digest('hex');
  }

  // -------------------------------------------------------------------------
  // Manifest
  // -------------------------------------------------------------------------

  private _loadManifest(): Record<string, unknown> {
    if (fs.existsSync(this._manifestPath)) {
      try {
        return JSON.parse(fs.readFileSync(this._manifestPath, 'utf-8'));
      } catch {
        // ignore
      }
    }
    return {
      version: 1,
      memory_file: path.basename(this._memoryPath),
      active_file: path.basename(this._activePath),
      active_last_hash: null,
      active_last_seq: 0,
      files: [],
      retention_months: this._config.retentionMonths,
      last_cleanup: null,
    };
  }

  private _saveManifest(manifest: Record<string, unknown>): void {
    const dir = path.dirname(this._manifestPath);
    if (dir && dir !== '.') {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = this._manifestPath + '.tmp';
    const content = JSON.stringify(manifest, null, 2) + '\n';
    fs.writeFileSync(tmpPath, content, 'utf-8');
    fs.renameSync(tmpPath, this._manifestPath);
  }

  private _addToManifest(fileEntry: Record<string, unknown>): void {
    const manifest = this._loadManifest();
    (manifest.files as unknown[]).push(fileEntry);
    manifest.active_file = path.basename(this._activePath);
    this._saveManifest(manifest);
  }

  private _updateManifestActive(entry: AuditEntry): void {
    // Only update every 100 writes to avoid excessive I/O
    if (this._seq % 100 === 0 || this._seq <= 1) {
      const manifest = this._loadManifest();
      manifest.active_last_seq = entry.seq;
      manifest.active_last_hash = this._prevHash;
      manifest.active_file = path.basename(this._activePath);
      this._saveManifest(manifest);
    }
  }

  private _cleanupRetention(): void {
    if (this._config.retentionMonths === null) return;
    if (this._inCleanup) return;
    this._inCleanup = true;

    try {
      this._doCleanupRetention();
    } finally {
      this._inCleanup = false;
    }
  }

  private _doCleanupRetention(): void {
    const now = new Date();
    const manifest = this._loadManifest();
    const files = manifest.files as Array<Record<string, unknown>>;
    const surviving: Array<Record<string, unknown>> = [];
    const deletedFiles: string[] = [];

    for (const f of files) {
      const period = f.period as string;
      const fileDate = AuditWriter._parsePeriod(period);
      if (!fileDate) {
        surviving.push(f);
        continue;
      }

      const ageMonths = (now.getUTCFullYear() - fileDate.getUTCFullYear()) * 12 +
        (now.getUTCMonth() - fileDate.getUTCMonth());

      if (ageMonths > (this._config.retentionMonths ?? 84)) {
        const filePath = path.join(path.dirname(this._activePath), f.filename as string);
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          deletedFiles.push(f.filename as string);
        } catch {
          surviving.push(f);
        }
      } else {
        surviving.push(f);
      }
    }

    manifest.files = surviving;
    manifest.last_cleanup = now.toISOString();
    this._saveManifest(manifest);

    // Emit audit event for retention cleanup (if any files were deleted)
    if (deletedFiles.length > 0) {
      this.write('audit_cleanup', {
        deleted_files: deletedFiles,
        retention_months: this._config.retentionMonths,
      });
    }
  }

  private static _parsePeriod(period: string | undefined | null): Date | null {
    if (!period) return null;
    // YYYY-MM
    if (/^\d{4}-\d{2}$/.test(period)) {
      return new Date(Date.UTC(parseInt(period.slice(0, 4)), parseInt(period.slice(5, 7)) - 1, 1));
    }
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
      const [y, m, d] = period.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d));
    }
    // YYYY-WNN (weekly)
    const weekMatch = period.match(/^(\d{4})-W(\d{2})$/);
    if (weekMatch) {
      const year = parseInt(weekMatch[1]);
      const week = parseInt(weekMatch[2]);
      const jan1 = new Date(Date.UTC(year, 0, 1));
      return new Date(jan1.getTime() + week * 7 * 86400000);
    }
    // Timestamp-based period from size rotation (e.g., 2026-03-21T190930)
    if (/^\d{4}-\d{2}-\d{2}T/.test(period)) {
      // Extract the date portion
      const datePart = period.slice(0, 10);
      const [y, m, d] = datePart.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d));
    }
    return null;
  }

  // -------------------------------------------------------------------------
  // Verification (static)
  // -------------------------------------------------------------------------

  static verify(auditPath: string): AuditVerifyResult {
    const resolvedPath = auditPath;
    const filesToVerify: string[] = [];
    let manifestPath: string | undefined;

    if (resolvedPath.endsWith('.manifest.json')) {
      manifestPath = resolvedPath;
    } else {
      const stem = resolvedPath.replace('.audit.jsonl', '');
      const candidate = stem + '.audit.manifest.json';
      if (fs.existsSync(candidate)) {
        manifestPath = candidate;
      }
    }

    // Collect rotated files from manifest
    if (manifestPath && fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        const dir = path.dirname(manifestPath);
        for (const f of (manifest.files ?? [])) {
          const fp = path.join(dir, f.filename);
          if (fs.existsSync(fp)) {
            filesToVerify.push(fp);
          }
        }
      } catch {
        // ignore
      }
    }

    // Add active file
    let activePath: string | undefined;
    if (resolvedPath.endsWith('.audit.jsonl')) {
      activePath = resolvedPath;
    } else if (manifestPath) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        const activeName = manifest.active_file;
        if (activeName) {
          const candidate = path.join(path.dirname(manifestPath), activeName);
          if (fs.existsSync(candidate)) activePath = candidate;
        }
      } catch {
        // ignore
      }
    }
    if (activePath && fs.existsSync(activePath)) {
      filesToVerify.push(activePath);
    }

    if (filesToVerify.length === 0) {
      return { valid: true, totalEntries: 0, filesVerified: 0, legacyEntries: 0 };
    }

    // Verify chain across all files
    let totalEntries = 0;
    let legacyEntries = 0;
    let prevHash = GENESIS_HASH;
    let filesVerified = 0;

    for (const filePath of filesToVerify) {
      filesVerified++;
      const lines = iterAuditLines(filePath);

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        totalEntries++;

        let entry: Record<string, unknown>;
        try {
          entry = JSON.parse(line);
        } catch {
          continue;
        }

        const entryPrevHash = entry.prev_hash as string | undefined;

        if (entryPrevHash === undefined || entryPrevHash === null) {
          // Legacy entry (pre-hash-chain)
          legacyEntries++;
          prevHash = LEGACY_BRIDGE_HASH;
          continue;
        }

        if (entryPrevHash === LEGACY_BRIDGE_HASH) {
          // Transition entry — accept and start chain from here
          prevHash = AuditWriter._computeHash(line);
          continue;
        }

        if (entryPrevHash !== prevHash) {
          return {
            valid: false,
            totalEntries,
            filesVerified,
            legacyEntries,
            chainBreakAt: (entry.seq as number) ?? totalEntries - 1,
            chainBreakFile: path.basename(filePath),
          };
        }

        prevHash = AuditWriter._computeHash(line);
      }
    }

    return { valid: true, totalEntries, filesVerified, legacyEntries };
  }

  // -------------------------------------------------------------------------
  // Query (static)
  // -------------------------------------------------------------------------

  static query(auditPath: string, options?: AuditQueryOptions): AuditQueryResult {
    const resolvedPath = auditPath;
    const filesToSearch: string[] = [];
    let manifestPath: string | undefined;
    const limit = options?.limit ?? 100;

    if (resolvedPath.endsWith('.manifest.json')) {
      manifestPath = resolvedPath;
    } else {
      const stem = resolvedPath.replace('.audit.jsonl', '');
      const candidate = stem + '.audit.manifest.json';
      if (fs.existsSync(candidate)) {
        manifestPath = candidate;
      }
    }

    // Add rotated files from manifest (filter by time range)
    if (manifestPath && fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        const dir = path.dirname(manifestPath);
        for (const f of (manifest.files ?? [])) {
          const fFirst = f.first_timestamp ?? '';
          const fLast = f.last_timestamp ?? '';
          if (options?.after && fLast && fLast < options.after) continue;
          if (options?.before && fFirst && fFirst > options.before) continue;
          const fp = path.join(dir, f.filename);
          if (fs.existsSync(fp)) filesToSearch.push(fp);
        }
      } catch {
        // ignore
      }
    }

    // Add active file
    let activePath: string | undefined;
    if (resolvedPath.endsWith('.audit.jsonl')) {
      activePath = resolvedPath;
    } else if (manifestPath) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        const activeName = manifest.active_file;
        if (activeName) {
          const candidate = path.join(path.dirname(manifestPath), activeName);
          if (fs.existsSync(candidate)) activePath = candidate;
        }
      } catch {
        // ignore
      }
    }
    if (activePath && fs.existsSync(activePath)) {
      filesToSearch.push(activePath);
    }

    const results: AuditEntry[] = [];
    let totalScanned = 0;

    for (const filePath of filesToSearch) {
      const lines = iterAuditLines(filePath);

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        totalScanned++;

        let entry: AuditEntry;
        try {
          entry = JSON.parse(line);
        } catch {
          continue;
        }

        // Apply filters
        const entryTs = entry.timestamp ?? '';
        if (options?.after && !tsAfter(entryTs, options.after)) continue;
        if (options?.before && !tsBefore(entryTs, options.before)) continue;
        if (options?.events && !options.events.includes(entry.event)) continue;
        if (options?.sessionId && entry.session_id !== options.sessionId) continue;
        if (options?.adapter) {
          if (!entry.adapter || entry.adapter.framework !== options.adapter) continue;
        }
        if (options?.nodeId && !entryMentionsNode(entry, options.nodeId)) continue;

        results.push(entry);
        if (results.length >= limit) break;
      }
      if (results.length >= limit) break;
    }

    // Optional chain verification
    let chainValid: boolean | undefined;
    let chainBreakAt: number | undefined;
    if (options?.verifyChain) {
      const vr = AuditWriter.verify(auditPath);
      chainValid = vr.valid;
      chainBreakAt = vr.chainBreakAt;
    }

    return {
      entries: results,
      totalScanned,
      filesSearched: filesToSearch.length,
      chainValid,
      chainBreakAt,
    };
  }

  /** The active audit file path. Exposed for testing and Memory integration. */
  get activePath(): string {
    return this._activePath;
  }

  /** The manifest file path. Exposed for testing. */
  get manifestPath(): string {
    return this._manifestPath;
  }
}

// =============================================================================
// Helpers
// =============================================================================

function iterAuditLines(filePath: string): string[] {
  if (filePath.endsWith('.gz')) {
    const compressed = fs.readFileSync(filePath);
    const decompressed = zlib.gunzipSync(compressed).toString('utf-8');
    return decompressed.split('\n');
  }
  return fs.readFileSync(filePath, 'utf-8').split('\n');
}

function entryMentionsNode(entry: AuditEntry, nodeId: string): boolean {
  return dictContainsValue(entry.data, nodeId);
}

function dictContainsValue(obj: unknown, target: string): boolean {
  if (typeof obj === 'string') return obj === target;
  if (Array.isArray(obj)) return obj.some(item => dictContainsValue(item, target));
  if (obj !== null && typeof obj === 'object') {
    return Object.values(obj).some(v => dictContainsValue(v, target));
  }
  return false;
}

function parseIsoTs(ts: string): Date {
  // Normalize Z → +00:00 for fromisoformat parity
  const normalized = ts.replace('Z', '+00:00');
  const d = new Date(normalized);
  if (!isNaN(d.getTime())) return d;
  // Date-only fallback
  const dateOnly = new Date(ts + 'T00:00:00Z');
  if (!isNaN(dateOnly.getTime())) return dateOnly;
  // Last resort: epoch
  return new Date(0);
}

function tsAfter(entryTs: string, after: string): boolean {
  return parseIsoTs(entryTs).getTime() >= parseIsoTs(after).getTime();
}

function tsBefore(entryTs: string, before: string): boolean {
  return parseIsoTs(entryTs).getTime() <= parseIsoTs(before).getTime();
}
