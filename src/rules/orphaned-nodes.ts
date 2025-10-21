/**
 * E004: Orphaned Nodes Rule
 *
 * Specification: spec/linter-rules.md lines 347-483
 *
 * Nodes with zero relationships (no edges in or out) are orphaned.
 * This indicates isolated thought with no connections.
 *
 * FlowScript is about relationships between thoughts.
 * Isolated nodes break the graph structure.
 *
 * Exception: Root questions and standalone insights may be degree 0.
 */

import { IR } from '../types';
import { BaseLintRule, LintResult } from '../linter';

export class OrphanedNodesRule extends BaseLintRule {
  name = 'orphaned-nodes';
  code = 'E004';
  severity = 'ERROR' as const;

  check(ir: IR): LintResult[] {
    const results: LintResult[] = [];

    // Build set of connected node IDs
    const connectedIds = new Set<string>();

    // 1. Add nodes connected via explicit relationships (->  <- <-> => ><[axis])
    for (const rel of ir.relationships) {
      connectedIds.add(rel.source);
      connectedIds.add(rel.target);
    }

    // 2. Add nodes connected via block hierarchies (parent-child relationships)
    for (const node of ir.nodes) {
      if (node.type === 'block' && node.ext?.children && Array.isArray(node.ext.children)) {
        // Mark the block as connected
        connectedIds.add(node.id);
        // Mark all children as connected
        for (const child of node.ext.children) {
          connectedIds.add(child.id);
        }
      }
    }

    // 3. Add nodes connected via hierarchical children arrays (spec-compliant)
    for (const node of ir.nodes) {
      if (node.children && node.children.length > 0) {
        // Mark the parent as connected
        connectedIds.add(node.id);
        // Mark all children as connected
        for (const childId of node.children) {
          connectedIds.add(childId);
        }
      }
    }

    // Check each node for connections
    for (const node of ir.nodes) {
      if (!connectedIds.has(node.id)) {

        // Node has degree 0 (no edges)
        results.push(this.createResult(
          `Orphaned node detected (no relationships): "${node.content}"`,
          {
            file: node.provenance.source_file,
            line: node.provenance.line_number
          },
          `Connect with relationship: ${node.content} -> {target} OR {source} -> ${node.content}`
        ));
      }
    }

    return results;
  }
}
