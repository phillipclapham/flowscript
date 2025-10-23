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

export interface TensionDetail {
  source: {
    id: string
    content: string
  }
  target: {
    id: string
    content: string
  }
  context?: Array<{
    id: string
    content: string
  }>
}

export interface TensionsResult {
  tensions_by_axis?: Record<string, TensionDetail[]>
  tensions_by_node?: Record<string, TensionDetail[]>
  tensions?: TensionDetail[]
  metadata: {
    total_tensions: number
    unique_axes: string[]
    most_common_axis: string | null
  }
}

export interface BlockerDetail {
  node: {
    id: string
    content: string
  }
  blocked_state: {
    reason: string
    since: string
    days_blocked: number
  }
  transitive_causes?: Array<{
    id: string
    content: string
  }>
  transitive_effects?: Array<{
    id: string
    content: string
  }>
  impact_score: number
}

export interface BlockedResult {
  blockers: BlockerDetail[]
  metadata: {
    total_blockers: number
    high_priority_count: number
    average_days_blocked: number
    oldest_blocker: {
      id: string
      days: number
    } | null
  }
}

export interface AlternativeDetail {
  id: string
  content: string
  chosen: boolean
  rationale?: string
  decided_on?: string
  rejection_reasons?: string[]  // Extracted from thought: nodes
  consequences?: Array<{
    id: string
    content: string
  }>
  tensions?: TensionInfo[]
}

// Discriminated union for format-specific alternatives() results
// Each format has exactly the fields it needs, enforced at compile time

export interface AlternativesResultComparison {
  format: 'comparison'
  question: {
    id: string
    content: string
  }
  alternatives: AlternativeDetail[]
  decision_summary: {
    chosen: string | null
    rationale: string | null
    rejected: string[]
    key_factors: string[]
  }
}

export interface AlternativesResultSimple {
  format: 'simple'
  question: string  // Just string, not object
  options_considered: string[]
  chosen: string | null
  reason: string | null
}

export interface TreeAlternative {
  id: string
  content: string
  chosen: boolean
  rejection_reasons?: string[]  // Optional rejection reasoning
  children: TreeAlternative[]  // Recursive structure
}

export interface AlternativesResultTree {
  format: 'tree'
  question: {
    id: string
    content: string
  }
  alternatives: TreeAlternative[]
}

// Discriminated union type - TypeScript enforces format checking
export type AlternativesResult =
  | AlternativesResultComparison
  | AlternativesResultTree
  | AlternativesResultSimple

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
   *
   * Extracts all tension relationships, groups by axis or node.
   * Returns systematic view of tradeoffs in the graph.
   */
  tensions(options: TensionOptions = {}): TensionsResult {
    const groupBy = options.groupBy || 'axis'
    const filterByAxis = options.filterByAxis
    const includeContext = options.includeContext || false
    const scope = options.scope

    // Get all tension relationships
    let tensionRels = this.ir.relationships.filter(rel => rel.type === 'tension')

    // Filter by scope if provided
    if (scope) {
      const scopeNodeIds = new Set<string>()
      scopeNodeIds.add(scope)

      // Get all descendants of scope node
      const descendants = this.traverseForward(scope, ['causes', 'temporal', 'derives_from'])
      descendants.forEach(d => scopeNodeIds.add(d.id))

      // Filter tensions to those within scope
      tensionRels = tensionRels.filter(rel =>
        scopeNodeIds.has(rel.source) && scopeNodeIds.has(rel.target)
      )
    }

    // Filter by axis if specified
    if (filterByAxis && filterByAxis.length > 0) {
      tensionRels = tensionRels.filter(rel =>
        rel.axis_label && filterByAxis.includes(rel.axis_label)
      )
    }

    // Build tension details
    const tensionDetails: Array<TensionDetail & { axis: string }> = []

    for (const rel of tensionRels) {
      const sourceNode = this.nodeMap.get(rel.source)
      const targetNode = this.nodeMap.get(rel.target)

      if (!sourceNode || !targetNode) continue

      const detail: TensionDetail & { axis: string } = {
        axis: rel.axis_label || 'unlabeled',
        source: {
          id: sourceNode.id,
          content: sourceNode.content
        },
        target: {
          id: targetNode.id,
          content: targetNode.content
        }
      }

      // Include context (parent nodes) if requested
      if (includeContext) {
        const context: Array<{ id: string; content: string }> = []

        // Find parents of source node
        const sourceParents = this.relationshipsToTarget.get(rel.source) || []
        for (const parentRel of sourceParents) {
          if (parentRel.type !== 'tension') {
            const parentNode = this.nodeMap.get(parentRel.source)
            if (parentNode) {
              context.push({
                id: parentNode.id,
                content: parentNode.content
              })
            }
          }
        }

        if (context.length > 0) {
          detail.context = context
        }
      }

      tensionDetails.push(detail)
    }

    // Calculate metadata
    const uniqueAxes = Array.from(new Set(tensionDetails.map(t => t.axis)))
    const axisCounts = new Map<string, number>()
    tensionDetails.forEach(t => {
      axisCounts.set(t.axis, (axisCounts.get(t.axis) || 0) + 1)
    })

    let mostCommonAxis: string | null = null
    let maxCount = 0
    for (const [axis, count] of axisCounts) {
      if (count > maxCount) {
        mostCommonAxis = axis
        maxCount = count
      }
    }

    const metadata = {
      total_tensions: tensionDetails.length,
      unique_axes: uniqueAxes,
      most_common_axis: mostCommonAxis
    }

    // Group by option
    if (groupBy === 'axis') {
      const byAxis: Record<string, TensionDetail[]> = {}
      tensionDetails.forEach(t => {
        if (!byAxis[t.axis]) {
          byAxis[t.axis] = []
        }
        const { axis, ...detail } = t
        byAxis[t.axis].push(detail)
      })

      return {
        tensions_by_axis: byAxis,
        metadata
      }
    } else if (groupBy === 'node') {
      const byNode: Record<string, TensionDetail[]> = {}
      tensionDetails.forEach(t => {
        const nodeId = t.source.id
        if (!byNode[nodeId]) {
          byNode[nodeId] = []
        }
        const { axis, ...detail } = t
        byNode[nodeId].push(detail)
      })

      return {
        tensions_by_node: byNode,
        metadata
      }
    } else {
      // groupBy === 'none' - flat array
      const flatTensions = tensionDetails.map(t => {
        const { axis, ...detail } = t
        return detail
      })

      return {
        tensions: flatTensions,
        metadata
      }
    }
  }

  /**
   * Query 4: Blocker tracking (state + dependencies)
   *
   * Finds all blocked nodes, calculates impact, shows transitive causes/effects.
   * Returns priority-sorted list of blockers.
   */
  blocked(options: BlockedOptions = {}): BlockedResult {
    const since = options.since
    const includeTransitiveCauses = options.includeTransitiveCauses !== false
    const includeTransitiveEffects = options.includeTransitiveEffects !== false

    // Find all blocked states
    let blockedStates = (this.ir.states || []).filter(state => state.type === 'blocked')

    // Filter by since date if provided
    if (since) {
      blockedStates = blockedStates.filter(state => {
        const stateSince = state.fields?.since
        if (!stateSince) return false
        return stateSince >= since
      })
    }

    // Build blocker details
    const blockers: BlockerDetail[] = []
    const today = new Date()

    for (const state of blockedStates) {
      const node = this.nodeMap.get(state.node_id)
      if (!node) continue

      const reason = state.fields?.reason || 'unknown'
      const sinceDate = state.fields?.since || ''

      // Calculate days blocked
      let daysBlocked = 0
      if (sinceDate) {
        const sinceTime = new Date(sinceDate).getTime()
        const todayTime = today.getTime()
        daysBlocked = Math.floor((todayTime - sinceTime) / (1000 * 60 * 60 * 24))
      }

      const detail: BlockerDetail = {
        node: {
          id: node.id,
          content: node.content
        },
        blocked_state: {
          reason,
          since: sinceDate,
          days_blocked: daysBlocked
        },
        impact_score: 0
      }

      // Find transitive causes (what's blocking this blocker)
      if (includeTransitiveCauses) {
        const causes = this.traverseBackward(node.id, ['derives_from', 'causes'])
        detail.transitive_causes = causes.map(c => ({
          id: c.id,
          content: c.content
        }))
      }

      // Find transitive effects (what's blocked by this blocker)
      if (includeTransitiveEffects) {
        const effects = this.traverseForward(node.id, ['causes', 'temporal'])
        detail.transitive_effects = effects.map(e => ({
          id: e.id,
          content: e.content
        }))
        detail.impact_score = effects.length
      }

      blockers.push(detail)
    }

    // Sort by impact score (descending), then by days blocked (descending)
    blockers.sort((a, b) => {
      if (a.impact_score !== b.impact_score) {
        return b.impact_score - a.impact_score
      }
      return b.blocked_state.days_blocked - a.blocked_state.days_blocked
    })

    // Calculate metadata
    const totalBlockers = blockers.length
    const highPriorityCount = blockers.filter(b =>
      b.impact_score > 0 || b.blocked_state.days_blocked > 7
    ).length

    const avgDaysBlocked = totalBlockers > 0
      ? blockers.reduce((sum, b) => sum + b.blocked_state.days_blocked, 0) / totalBlockers
      : 0

    let oldestBlocker: { id: string; days: number } | null = null
    if (blockers.length > 0) {
      const oldest = blockers.reduce((max, b) =>
        b.blocked_state.days_blocked > max.blocked_state.days_blocked ? b : max
      )
      oldestBlocker = {
        id: oldest.node.id,
        days: oldest.blocked_state.days_blocked
      }
    }

    return {
      blockers,
      metadata: {
        total_blockers: totalBlockers,
        high_priority_count: highPriorityCount,
        average_days_blocked: Math.round(avgDaysBlocked * 10) / 10,
        oldest_blocker: oldestBlocker
      }
    }
  }

  /**
   * Query 5: Decision reconstruction (alternatives + rationale)
   *
   * Reconstructs decision with all alternatives, showing which was chosen and why.
   * Supports three formats: comparison (default), simple, tree.
   */
  alternatives(questionId: string, options: AlternativesOptions = {}): AlternativesResult {
    const format = options.format || 'comparison'
    const includeRationale = options.includeRationale !== false
    const includeConsequences = options.includeConsequences || false
    const showRejectedReasons = options.showRejectedReasons || false

    // Verify questionId is a question node
    const questionNode = this.nodeMap.get(questionId)
    if (!questionNode) {
      throw new Error(`Node not found: ${questionId}`)
    }
    if (questionNode.type !== 'question') {
      throw new Error(`Node ${questionId} is not a question (type: ${questionNode.type})`)
    }

    // Find all alternative relationships from question
    const altRels = (this.relationshipsFromSource.get(questionId) || [])
      .filter(rel => rel.type === 'alternative')

    // Format-specific routing
    switch (format) {
      case 'simple': {
        // Simple format: minimal summary (question + options + chosen + reason)
        const alternatives: Array<{ id: string; content: string; chosen: boolean; rationale?: string }> = []

        for (const altRel of altRels) {
          const altNode = this.nodeMap.get(altRel.target)
          if (!altNode) continue

          // Check if chosen
          let isChosen = false
          let rationale: string | undefined

          for (const state of this.ir.states || []) {
            if (state.type === 'decided') {
              const stateNode = this.nodeMap.get(state.node_id)
              if (stateNode && stateNode.content === altNode.content) {
                isChosen = true
                if (includeRationale && state.fields) {
                  rationale = state.fields.rationale
                }
              }
            }
          }

          alternatives.push({
            id: altNode.id,
            content: altNode.content,
            chosen: isChosen,
            rationale
          })
        }

        const chosenAlt = alternatives.find(a => a.chosen)

        return {
          format: 'simple',
          question: questionNode.content,
          options_considered: alternatives.map(a => a.content),
          chosen: chosenAlt?.content || null,
          reason: chosenAlt?.rationale || null
        }
      }

      case 'tree': {
        // Tree format: hierarchical structure with recursive children
        const treeAlternatives = altRels.map(altRel =>
          this.buildAlternativeTree(altRel.target, new Set(), showRejectedReasons)
        )

        return {
          format: 'tree',
          question: {
            id: questionNode.id,
            content: questionNode.content
          },
          alternatives: treeAlternatives
        }
      }

      case 'comparison':
      default: {
        // Comparison format: full decision analysis with all details
        const alternatives: AlternativeDetail[] = []
        let chosenAlternative: AlternativeDetail | null = null

        for (const altRel of altRels) {
          const altNode = this.nodeMap.get(altRel.target)
          if (!altNode) continue

          // Check if this alternative was chosen (has decided state)
          let isChosen = false
          let rationale: string | undefined
          let decidedOn: string | undefined

          // Check all states for decisions related to this alternative
          for (const state of this.ir.states || []) {
            if (state.type === 'decided') {
              const stateNode = this.nodeMap.get(state.node_id)
              if (stateNode && stateNode.content === altNode.content) {
                isChosen = true
                if (includeRationale && state.fields) {
                  rationale = state.fields.rationale
                  decidedOn = state.fields.on
                }
              }
            }
          }

          const detail: AlternativeDetail = {
            id: altNode.id,
            content: altNode.content,
            chosen: isChosen
          }

          if (isChosen && rationale) {
            detail.rationale = rationale
            detail.decided_on = decidedOn
          }

          // Extract rejection reasons from thought nodes (only for rejected alternatives)
          if (showRejectedReasons && !isChosen) {
            const reasons = this.extractRejectionReasons(altNode.id)
            if (reasons.length > 0) {
              detail.rejection_reasons = reasons
            }
          }

          // Get consequences (children of alternative)
          if (includeConsequences) {
            const consequences = (this.relationshipsFromSource.get(altNode.id) || [])
              .filter(rel => rel.type === 'causes')
              .map(rel => {
                const childNode = this.nodeMap.get(rel.target)
                return childNode ? {
                  id: childNode.id,
                  content: childNode.content
                } : null
              })
              .filter(c => c !== null) as Array<{ id: string; content: string }>

            if (consequences.length > 0) {
              detail.consequences = consequences
            }
          }

          // Find tensions within this alternative
          const altTensions = (this.relationshipsFromSource.get(altNode.id) || [])
            .filter(rel => rel.type === 'tension')
            .map(rel => {
              const targetNode = this.nodeMap.get(rel.target)
              if (!targetNode) return null
              return {
                axis: rel.axis_label || 'unlabeled',
                source: {
                  id: altNode.id,
                  content: altNode.content
                },
                target: {
                  id: targetNode.id,
                  content: targetNode.content
                }
              }
            })
            .filter(t => t !== null) as TensionInfo[]

          if (altTensions.length > 0) {
            detail.tensions = altTensions
          }

          alternatives.push(detail)

          if (isChosen) {
            chosenAlternative = detail
          }
        }

        // Build decision summary
        const rejected = alternatives
          .filter(alt => !alt.chosen)
          .map(alt => alt.content)

        const keyFactors: string[] = []
        if (chosenAlternative?.tensions) {
          keyFactors.push(...chosenAlternative.tensions.map(t => t.axis))
        }

        return {
          format: 'comparison',
          question: {
            id: questionNode.id,
            content: questionNode.content
          },
          alternatives,
          decision_summary: {
            chosen: chosenAlternative?.content || null,
            rationale: chosenAlternative?.rationale || null,
            rejected,
            key_factors: Array.from(new Set(keyFactors))
          }
        }
      }
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Extract rejection reasons from thought: nodes under an alternative
   *
   * Convention: thought nodes that are children (via 'causes' relationships)
   * of a rejected alternative are interpreted as rejection reasoning.
   *
   * @param altNodeId - The alternative node ID to extract rejection reasons from
   * @returns Array of rejection reason strings (thought node contents)
   */
  private extractRejectionReasons(altNodeId: string): string[] {
    const thoughts = (this.relationshipsFromSource.get(altNodeId) || [])
      .filter(rel => rel.type === 'causes')
      .map(rel => this.nodeMap.get(rel.target))
      .filter(node => node !== undefined && node.type === 'thought')
      .map(node => node!.content)

    return thoughts
  }

  /**
   * Build a recursive tree structure for an alternative and its consequence children
   *
   * Shows hierarchical structure of consequences (via 'causes' relationships).
   * Includes cycle detection to handle potential graph cycles.
   *
   * @param nodeId - The node ID to start building from
   * @param visited - Set of already visited node IDs for cycle detection
   * @param includeRejectionReasons - Whether to include rejection reasons for rejected alternatives
   * @returns TreeAlternative structure with recursive children
   */
  private buildAlternativeTree(
    nodeId: string,
    visited: Set<string> = new Set(),
    includeRejectionReasons: boolean = false
  ): TreeAlternative {
    // Cycle detection
    if (visited.has(nodeId)) {
      const node = this.nodeMap.get(nodeId)!
      return {
        id: node.id,
        content: node.content + ' [cycle detected]',
        chosen: false,
        children: []
      }
    }

    visited.add(nodeId)
    const node = this.nodeMap.get(nodeId)!

    // Check if this node is chosen (has decided state)
    const isChosen = this.ir.states?.some(
      s => s.type === 'decided' && s.node_id === nodeId
    ) || false

    // Build tree node
    const treeNode: TreeAlternative = {
      id: node.id,
      content: node.content,
      chosen: isChosen,
      children: []
    }

    // Add rejection reasons if requested and not chosen
    if (includeRejectionReasons && !isChosen) {
      const reasons = this.extractRejectionReasons(nodeId)
      if (reasons.length > 0) {
        treeNode.rejection_reasons = reasons
      }
    }

    // Recursively build children (only consequence relationships via 'causes')
    const childRels = (this.relationshipsFromSource.get(nodeId) || [])
      .filter(rel => rel.type === 'causes')

    for (const rel of childRels) {
      // Pass copy of visited set to allow multiple paths to same node
      const childTree = this.buildAlternativeTree(
        rel.target,
        new Set(visited),
        includeRejectionReasons
      )
      treeNode.children.push(childTree)
    }

    return treeNode
  }

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
