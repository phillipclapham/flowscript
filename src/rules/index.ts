/**
 * FlowScript Linter Rules - Export Index
 *
 * Exports all 9 validation rules (6 ERROR + 3 WARNING)
 */

// ERROR rules
export { UnlabeledTensionRule } from './unlabeled-tension';
export { MissingRequiredFieldsRule } from './missing-required-fields';
export { InvalidSyntaxRule } from './invalid-syntax';
export { OrphanedNodesRule } from './orphaned-nodes';
export { CausalCyclesRule } from './causal-cycles';
export { AlternativesWithoutDecisionRule } from './alternatives-without-decision';

// WARNING rules
export { MissingRecommendedFieldsRule } from './missing-recommended-fields';
export { DeepNestingRule } from './deep-nesting';
export { LongCausalChainsRule } from './long-causal-chains';
