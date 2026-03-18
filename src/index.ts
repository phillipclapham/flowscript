/**
 * FlowScript Toolchain - Main Library Exports
 *
 * Exports all public APIs for programmatic use.
 * For CLI usage, see bin/flowscript
 */

// Parser
export { Parser } from './parser';

// Linter
export { Linter, LintResult, LintRule, Severity, BaseLintRule } from './linter';

// Validator
export { validateIR, ValidationResult } from './validate';

// Query Engine
export {
  FlowScriptQueryEngine,
  WhyOptions,
  WhatIfOptions,
  TensionOptions,
  BlockedOptions,
  AlternativesOptions,
  CausalAncestry,
  MinimalWhy,
  ImpactAnalysis,
  ImpactSummary,
  TensionsResult,
  TensionDetail,
  BlockedResult,
  BlockerDetail,
  AlternativesResult,
  AlternativesResultComparison,
  AlternativesResultTree,
  AlternativesResultSimple,
  TreeAlternative,
  AlternativeDetail,
  TensionInfo
} from './query-engine';

// Serializer (IR → .fs)
export { serialize, SerializeOptions } from './serializer';

// Memory (programmatic builder + temporal intelligence)
export {
  Memory,
  NodeRef,
  MemoryOptions,
  TemporalConfig,
  TemporalTierConfig,
  DormancyConfig,
  TemporalTier,
  TemporalMeta,
  GardenReport,
  PruneReport,
  SessionStartResult,
  SessionEndResult,
  SessionWrapResult,
  SnapshotEntry,
  SnapshotInfo,
  GraduationCandidate,
  GraduationResult,
  GraduationHandler,
  MemoryJSON,
  BudgetedSerializeOptions,
  ToolSchema,
  ToolResult,
  MemoryTool,
  AsToolsOptions,
  ExtractFn,
  FromTranscriptOptions,
  TranscriptExtraction,
  AuditEntry
} from './memory';

// Hash utilities
export { hashContent } from './hash';

// Type definitions
export * from './types';
