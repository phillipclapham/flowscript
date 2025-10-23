/**
 * FlowScript Query Engine
 *
 * Computational operations on FlowScript IR graphs that prove FlowScript is a
 * "computable substrate" for cognitive partnership.
 *
 * This module implements five critical queries:
 * 1. why(nodeId) - Causal ancestry (backward traversal)
 * 2. whatIf(nodeId) - Impact analysis (forward traversal)
 * 3. tensions() - Tradeoff mapping (tension extraction)
 * 4. blocked() - Blocker tracking (state + dependencies)
 * 5. alternatives(questionId) - Decision reconstruction
 */

import { IR, Node, Relationship, State, RelationType } from './types'

// ============================================================================
// Query Options Interfaces
// ============================================================================

export interface WhyOptions {
  maxDepth?: number
  includeCorrelations?: boolean
  format?: 'chain' | 'tree' | 'minimal'
}

export interface WhatIfOptions {
  maxDepth?: number
  includeCorrelations?: boolean
  includeTemporalConsequences?: boolean
  format?: 'tree' | 'list' | 'summary'
}

export interface TensionOptions {
  groupBy?: 'axis' | 'node' | 'none'
  filterByAxis?: string[]
  includeContext?: boolean
  scope?: string
}

export interface BlockedOptions {
  since?: string
  includeTransitiveCauses?: boolean
  includeTransitiveEffects?: boolean
  format?: 'detailed' | 'summary' | 'list'
}

export interface AlternativesOptions {
  includeRationale?: boolean
  includeConsequences?: boolean
  showRejectedReasons?: boolean
  format?: 'comparison' | 'tree' | 'simple'
}

// ============================================================================
// Query Result Interfaces
// ============================================================================

export interface CausalChainNode {
  depth: number
  id: string
  content: string
  relationship_type: string
}

export interface CausalAncestry {
  target: {
    id: string
    content: string
  }
  causal_chain: CausalChainNode[]
  root_cause: {
    id: string
    content: string
    is_root: boolean
  }
  metadata: {
    total_ancestors: number
    max_depth: number
    has_multiple_paths: boolean
  }
}

export interface MinimalWhy {
  root_cause: string
  chain: string[]
}

export interface ImpactConsequence {
  id: string
  content: string
  relationship: string
  depth: number
  has_tension?: boolean
  tension_axis?: string
}

export interface TensionInfo {
  axis: string
  source: {
    id: string
    content: string
  }
  target: {
    id: string
    content: string
  }
}

export interface ImpactAnalysis {
  source: {
    id: string
    content: string
  }
  impact_tree: {
    direct_consequences: ImpactConsequence[]
    indirect_consequences: ImpactConsequence[]
  }
  tensions_in_impact_zone: TensionInfo[]
  metadata: {
    total_descendants: number
    max_depth: number
    tension_count: number
    has_temporal_consequences: boolean
  }
}

export interface ImpactSummary {
  impact_summary: string
  benefits: string[]
  risks: string[]
  key_tradeoff: string | null
}

// ============================================================================
// FlowScript Query Engine
// ============================================================================

export class FlowScriptQueryEngine {
  private ir!: IR
  private nodeMap!: Map<string, Node>
  private relationshipsFromSource!: Map<string, Relationship[]>
  private relationshipsToTarget!: Map<string, Relationship[]>
  private stateMap!: Map<string, State>

  constructor() {
    this.nodeMap = new Map()
    this.relationshipsFromSource = new Map()
    this.relationshipsToTarget = new Map()
    this.stateMap = new Map()
  }

  /**
   * Load IR graph and build indexes for efficient querying
   */
  load(ir: IR): void {
    this.ir = ir
    this.buildIndexes()
  }

  /**
   * Build efficient indexes for O(1) lookups
   */
  private buildIndexes(): void {
    // Clear existing indexes
    this.nodeMap.clear()
    this.relationshipsFromSource.clear()
    this.relationshipsToTarget.clear()
    this.stateMap.clear()

    // Node map: id -> Node
    for (const node of this.ir.nodes) {
      this.nodeMap.set(node.id, node)
    }

    // Relationship indexes: source -> [relationships], target -> [relationships]
    for (const rel of this.ir.relationships) {
      // From source
      if (!this.relationshipsFromSource.has(rel.source)) {
        this.relationshipsFromSource.set(rel.source, [])
      }
      this.relationshipsFromSource.get(rel.source)!.push(rel)

      // To target
      if (!this.relationshipsToTarget.has(rel.target)) {
        this.relationshipsToTarget.set(rel.target, [])
      }
      this.relationshipsToTarget.get(rel.target)!.push(rel)
    }

    // State map: node_id -> State
    for (const state of this.ir.states || []) {
      this.stateMap.set(state.node_id, state)
    }
  }

  /**
   * Query 1: Trace causal ancestry (backward traversal)
   *
   * Traces backward through causal relationships to understand why a node exists.
   * Returns causal chain from root causes to target node.
   */
  why(nodeId: string, options: WhyOptions = {}): CausalAncestry | MinimalWhy {
    const format = options.format || 'chain'
    const maxDepth = options.maxDepth
    const includeCorrelations = options.includeCorrelations || false

    // Build relationship types to follow
    // Note: We follow both derives_from AND causes (backward) because:
    // - "A <- B" (derives_from): A explicitly derives from B
    // - "A -> B" (causes): B is caused by A, so B derives from A
    const relationshipTypes: RelationType[] = ['derives_from', 'causes']
    if (includeCorrelations) {
      relationshipTypes.push('equivalent')
    }

    // Traverse backward to find all ancestors
    const ancestors = this.traverseBackward(nodeId, relationshipTypes, maxDepth)

    // Get target node
    const targetNode = this.nodeMap.get(nodeId)
    if (!targetNode) {
      throw new Error(`Node not found: ${nodeId}`)
    }

    // Build causal chain from root to target
    const { chain, rootCause } = this.buildCausalChain(nodeId, ancestors, relationshipTypes)

    // Format based on options
    if (format === 'minimal') {
      return {
        root_cause: rootCause.content,
        chain: chain.map(n => n.content)
      }
    }

    // Default: 'chain' format
    return {
      target: {
        id: targetNode.id,
        content: targetNode.content
      },
      causal_chain: chain.map((node, index) => ({
        depth: chain.length - index,
        id: node.id,
        content: node.content,
        relationship_type: node.relationshipType || 'derives_from'
      })),
      root_cause: {
        id: rootCause.id,
        content: rootCause.content,
        is_root: true
      },
      metadata: {
        total_ancestors: ancestors.length,
        max_depth: chain.length,
        has_multiple_paths: this.hasMultiplePaths(nodeId, relationshipTypes)
      }
    }
  }

  /**
   * Query 2: Impact analysis (forward traversal)
   *
   * Traces forward through causal relationships to understand consequences.
   * Returns impact tree with tensions in impact zone.
   */
  whatIf(nodeId: string, options: WhatIfOptions = {}): ImpactAnalysis | ImpactSummary {
    const format = options.format || 'tree'
    const maxDepth = options.maxDepth
    const includeCorrelations = options.includeCorrelations || false
    const includeTemporalConsequences = options.includeTemporalConsequences !== false

    // Build relationship types to follow
    const relationshipTypes: RelationType[] = ['causes']
    if (includeTemporalConsequences) {
      relationshipTypes.push('temporal')
    }
    if (includeCorrelations) {
      relationshipTypes.push('equivalent')
    }

    // Get source node
    const sourceNode = this.nodeMap.get(nodeId)
    if (!sourceNode) {
      throw new Error(`Node not found: ${nodeId}`)
    }

    // Traverse forward to find all descendants
    const descendants = this.traverseForward(nodeId, relationshipTypes, maxDepth)

    // Build impact tree with depth information
    const impactTree = this.buildImpactTree(nodeId, descendants, relationshipTypes)

    // Find tensions in descendant subgraph
    const descendantIds = new Set(descendants.map(d => d.id))
    descendantIds.add(nodeId)
    const tensions = this.findTensionsInSubgraph(descendantIds)

    // Check if temporal consequences exist
    const hasTemporalConsequences = descendants.some(d =>
      d.relationshipType === 'temporal'
    )

    // Format: 'summary'
    if (format === 'summary') {
      return this.buildImpactSummary(sourceNode, descendants, tensions)
    }

    // Default: 'tree' or 'list' format
    return {
      source: {
        id: sourceNode.id,
        content: sourceNode.content
      },
      impact_tree: impactTree,
      tensions_in_impact_zone: tensions,
      metadata: {
        total_descendants: descendants.length,
        max_depth: Math.max(...descendants.map(d => d.depth || 0), 0),
        tension_count: tensions.length,
        has_temporal_consequences: hasTemporalConsequences
      }
    }
  }

  /**
   * Query 3: Tradeoff mapping (tension extraction)
   * Implementation in Session 6b
   */
  tensions(options: TensionOptions = {}): any {
    throw new Error('Not implemented yet - Session 6b')
  }

  /**
   * Query 4: Blocker tracking (state + dependencies)
   * Implementation in Session 6b
   */
  blocked(options: BlockedOptions = {}): any {
    throw new Error('Not implemented yet - Session 6b')
  }

  /**
   * Query 5: Decision reconstruction (alternatives + rationale)
   * Implementation in Session 6b
   */
  alternatives(questionId: string, options: AlternativesOptions = {}): any {
    throw new Error('Not implemented yet - Session 6b')
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Traverse backward through relationships
   */
  private traverseBackward(
    nodeId: string,
    relationshipTypes: RelationType[],
    maxDepth?: number,
    visited: Set<string> = new Set(),
    currentDepth: number = 0
  ): Array<Node & { depth: number; relationshipType?: RelationType }> {
    // Check depth limit
    if (maxDepth !== undefined && currentDepth >= maxDepth) {
      return []
    }

    // Check cycles
    if (visited.has(nodeId)) {
      return []
    }

    visited.add(nodeId)

    const result: Array<Node & { depth: number; relationshipType?: RelationType }> = []

    // Get all incoming relationships to this node
    const incomingRels = this.relationshipsToTarget.get(nodeId) || []

    // Filter by relationship types
    const relevantRels = incomingRels.filter(rel =>
      relationshipTypes.includes(rel.type)
    )

    // Traverse each parent
    for (const rel of relevantRels) {
      const parentNode = this.nodeMap.get(rel.source)
      if (parentNode) {
        // Add parent to result
        result.push({
          ...parentNode,
          depth: currentDepth + 1,
          relationshipType: rel.type
        })

        // Recursively traverse parent's ancestors
        const ancestors = this.traverseBackward(
          rel.source,
          relationshipTypes,
          maxDepth,
          new Set(visited),
          currentDepth + 1
        )
        result.push(...ancestors)
      }
    }

    return result
  }

  /**
   * Traverse forward through relationships
   */
  private traverseForward(
    nodeId: string,
    relationshipTypes: RelationType[],
    maxDepth?: number,
    visited: Set<string> = new Set(),
    currentDepth: number = 0
  ): Array<Node & { depth: number; relationshipType?: RelationType }> {
    // Check depth limit
    if (maxDepth !== undefined && currentDepth >= maxDepth) {
      return []
    }

    // Check cycles
    if (visited.has(nodeId)) {
      return []
    }

    visited.add(nodeId)

    const result: Array<Node & { depth: number; relationshipType?: RelationType }> = []

    // Get all outgoing relationships from this node
    const outgoingRels = this.relationshipsFromSource.get(nodeId) || []

    // Filter by relationship types
    const relevantRels = outgoingRels.filter(rel =>
      relationshipTypes.includes(rel.type)
    )

    // Traverse each child
    for (const rel of relevantRels) {
      const childNode = this.nodeMap.get(rel.target)
      if (childNode) {
        // Add child to result
        result.push({
          ...childNode,
          depth: currentDepth + 1,
          relationshipType: rel.type
        })

        // Recursively traverse child's descendants
        const descendants = this.traverseForward(
          rel.target,
          relationshipTypes,
          maxDepth,
          new Set(visited),
          currentDepth + 1
        )
        result.push(...descendants)
      }
    }

    return result
  }

  /**
   * Build causal chain from root to target
   */
  private buildCausalChain(
    targetId: string,
    ancestors: Array<Node & { depth: number; relationshipType?: RelationType }>,
    relationshipTypes: RelationType[]
  ): {
    chain: Array<Node & { relationshipType?: RelationType }>
    rootCause: Node
  } {
    // If no ancestors, target is its own root
    if (ancestors.length === 0) {
      const targetNode = this.nodeMap.get(targetId)!
      return {
        chain: [],
        rootCause: targetNode
      }
    }

    // Find root (deepest ancestor)
    const maxDepth = Math.max(...ancestors.map(a => a.depth))
    const roots = ancestors.filter(a => a.depth === maxDepth)
    const root = roots[0]

    // Build chain from root to target
    const chain: Array<Node & { relationshipType?: RelationType }> = [root]
    let currentId = root.id

    // Walk from root back to target, only using nodes from ancestors
    const ancestorIds = new Set(ancestors.map(a => a.id))
    ancestorIds.add(targetId)

    while (currentId !== targetId) {
      // Find next node in chain (must be in ancestors or be the target)
      const outgoingRels = this.relationshipsFromSource.get(currentId) || []
      const nextRel = outgoingRels.find(rel =>
        relationshipTypes.includes(rel.type) &&
        ancestorIds.has(rel.target)
      )

      if (!nextRel) break

      const nextNode = this.nodeMap.get(nextRel.target)
      if (!nextNode) break

      // Don't add target to chain (chain is ancestors only)
      if (nextRel.target === targetId) {
        break
      }

      // Only add if it's in our filtered ancestors (respects maxDepth)
      const ancestorNode = ancestors.find(a => a.id === nextRel.target)
      if (!ancestorNode) break

      chain.push({
        ...nextNode,
        relationshipType: nextRel.type
      })
      currentId = nextRel.target
    }

    return {
      chain,
      rootCause: root
    }
  }

  /**
   * Check if node has multiple causal paths
   */
  private hasMultiplePaths(nodeId: string, relationshipTypes: RelationType[]): boolean {
    const incomingRels = this.relationshipsToTarget.get(nodeId) || []
    const relevantRels = incomingRels.filter(rel =>
      relationshipTypes.includes(rel.type)
    )
    return relevantRels.length > 1
  }

  /**
   * Build impact tree with direct and indirect consequences
   */
  private buildImpactTree(
    sourceId: string,
    descendants: Array<Node & { depth: number; relationshipType?: RelationType }>,
    relationshipTypes: RelationType[]
  ): {
    direct_consequences: ImpactConsequence[]
    indirect_consequences: ImpactConsequence[]
  } {
    const direct = descendants.filter(d => d.depth === 1)
    const indirect = descendants.filter(d => d.depth > 1)

    // Check which nodes have tensions
    const tensionNodeIds = new Set<string>()
    for (const rel of this.ir.relationships) {
      if (rel.type === 'tension') {
        tensionNodeIds.add(rel.source)
        tensionNodeIds.add(rel.target)
      }
    }

    return {
      direct_consequences: direct.map(node => ({
        id: node.id,
        content: node.content,
        relationship: node.relationshipType || 'causes',
        depth: node.depth,
        has_tension: tensionNodeIds.has(node.id)
      })),
      indirect_consequences: indirect.map(node => {
        const consequence: ImpactConsequence = {
          id: node.id,
          content: node.content,
          relationship: node.relationshipType || 'causes',
          depth: node.depth
        }

        // Check if this node is involved in a tension
        const tensionRel = this.ir.relationships.find(rel =>
          rel.type === 'tension' && (rel.source === node.id || rel.target === node.id)
        )
        if (tensionRel) {
          consequence.tension_axis = tensionRel.axis_label || undefined
        }

        return consequence
      })
    }
  }

  /**
   * Find all tensions in a subgraph
   */
  private findTensionsInSubgraph(nodeIds: Set<string>): TensionInfo[] {
    const tensions: TensionInfo[] = []

    for (const rel of this.ir.relationships) {
      if (rel.type === 'tension' && nodeIds.has(rel.source) && nodeIds.has(rel.target)) {
        const sourceNode = this.nodeMap.get(rel.source)
        const targetNode = this.nodeMap.get(rel.target)

        if (sourceNode && targetNode) {
          tensions.push({
            axis: rel.axis_label || 'unlabeled',
            source: {
              id: sourceNode.id,
              content: sourceNode.content
            },
            target: {
              id: targetNode.id,
              content: targetNode.content
            }
          })
        }
      }
    }

    return tensions
  }

  /**
   * Build impact summary format
   */
  private buildImpactSummary(
    sourceNode: Node,
    descendants: Array<Node & { depth: number; relationshipType?: RelationType }>,
    tensions: TensionInfo[]
  ): ImpactSummary {
    // Heuristic: classify consequences as benefits or risks
    // This is a simple heuristic - can be improved later
    const benefits: string[] = []
    const risks: string[] = []

    for (const desc of descendants) {
      // Simple heuristic: check for positive/negative keywords
      const content = desc.content.toLowerCase()
      if (content.includes('risk') || content.includes('problem') ||
          content.includes('issue') || content.includes('error') ||
          content.includes('fail')) {
        risks.push(desc.content)
      } else {
        benefits.push(desc.content)
      }
    }

    // Key tradeoff from first tension
    const keyTradeoff = tensions.length > 0
      ? `${tensions[0].axis} (${tensions[0].source.content} vs ${tensions[0].target.content})`
      : null

    return {
      impact_summary: `${sourceNode.content} affects ${descendants.length} downstream consideration${descendants.length === 1 ? '' : 's'}`,
      benefits,
      risks,
      key_tradeoff: keyTradeoff
    }
  }
}
