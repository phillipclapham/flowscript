/**
 * FlowScript Linter Rules - Export Index
 *
 * Exports all 15 validation rules (11 ERROR + 4 WARNING)
 */

// ERROR rules
export { UnlabeledTensionRule } from './unlabeled-tension';
export { MissingRequiredFieldsRule } from './missing-required-fields';
export { InvalidSyntaxRule } from './invalid-syntax';
export { OrphanedNodesRule } from './orphaned-nodes';
export { CausalCyclesRule } from './causal-cycles';
export { AlternativesWithoutDecisionRule } from './alternatives-without-decision';

// Fixpoint ERROR rules
export { FixpointConstraintViolationRule } from './fixpoint-constraint-violation';
export { FixpointL2MissingBoundRule } from './fixpoint-l2-missing-bound';
export { FixpointMissingConstraintRule } from './fixpoint-missing-constraint';
export { FixpointUnstratifiableNegationRule } from './fixpoint-unstratifiable-negation';
export { FixpointNestingDeEscalationRule } from './fixpoint-nesting-de-escalation';

// WARNING rules
export { MissingRecommendedFieldsRule } from './missing-recommended-fields';
export { DeepNestingRule } from './deep-nesting';
export { LongCausalChainsRule } from './long-causal-chains';
export { FixpointHighIterationCountRule } from './fixpoint-high-iteration-count';
