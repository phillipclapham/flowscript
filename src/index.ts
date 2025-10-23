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
  AlternativeDetail,
  TensionInfo
} from './query-engine';

// Hash utilities
export { hashContent } from './hash';

// Type definitions
export * from './types';
