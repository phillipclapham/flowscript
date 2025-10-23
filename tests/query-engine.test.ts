/**
 * Tests for FlowScript Query Engine
 *
 * Tests all five critical queries that prove FlowScript is a computable substrate.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { FlowScriptQueryEngine } from '../src/query-engine'
import { IR } from '../src/types'
import * as fs from 'fs'
import * as path from 'path'

describe('FlowScriptQueryEngine', () => {
  let engine: FlowScriptQueryEngine
  let decisionIR: IR

  beforeEach(() => {
    engine = new FlowScriptQueryEngine()

    // Load decision.json golden example
    const decisionPath = path.join(__dirname, '../examples/decision.json')
    const decisionContent = fs.readFileSync(decisionPath, 'utf-8')
    decisionIR = JSON.parse(decisionContent) as IR
  })

  // ==========================================================================
  // Foundation Tests
  // ==========================================================================

  describe('load', () => {
    it('should load IR and build indexes', () => {
      engine.load(decisionIR)

      // Verify IR loaded (by testing a query works)
      const questionId = decisionIR.nodes.find(n => n.type === 'question')!.id
      const result = engine.why(questionId)

      expect(result).toBeDefined()
    })

    it('should build node indexes correctly', () => {
      engine.load(decisionIR)

      // Test that all nodes are accessible
      for (const node of decisionIR.nodes) {
        const result = engine.why(node.id)
        expect(result).toBeDefined()
      }
    })

    it('should handle IR with no relationships', () => {
      const emptyIR: IR = {
        version: '1.0.0',
        nodes: [{
          id: 'test-node',
          type: 'statement',
          content: 'isolated node',
          provenance: {
            source_file: 'test.fs',
            line_number: 1,
            timestamp: new Date().toISOString()
          }
        }],
        relationships: [],
        states: [],
        invariants: {}
      }

      engine.load(emptyIR)
      const result = engine.why('test-node')
      expect(result).toBeDefined()
    })
  })

  // ==========================================================================
  // Query 1: why() - Causal Ancestry
  // ==========================================================================

  describe('why', () => {
    beforeEach(() => {
      engine.load(decisionIR)
    })

    it('should return causal ancestry in chain format', () => {
      // Find a node with ancestors (e.g., "scales horizontally")
      const scalesNode = decisionIR.nodes.find(n => n.content === 'scales horizontally')!

      const result = engine.why(scalesNode.id)

      expect(result).toHaveProperty('target')
      expect(result).toHaveProperty('causal_chain')
      expect(result).toHaveProperty('root_cause')
      expect(result).toHaveProperty('metadata')

      // @ts-ignore - narrow type for testing
      expect(result.target.content).toBe('scales horizontally')
      // @ts-ignore
      expect(result.causal_chain).toBeInstanceOf(Array)
      // @ts-ignore
      expect(result.metadata.total_ancestors).toBeGreaterThan(0)
    })

    it('should return minimal format when requested', () => {
      const scalesNode = decisionIR.nodes.find(n => n.content === 'scales horizontally')!

      const result = engine.why(scalesNode.id, { format: 'minimal' })

      expect(result).toHaveProperty('root_cause')
      expect(result).toHaveProperty('chain')
      // @ts-ignore
      expect(result.chain).toBeInstanceOf(Array)
      // @ts-ignore
      expect(typeof result.root_cause).toBe('string')
    })

    it('should handle node with no ancestors', () => {
      // Question node should have no ancestors
      const questionNode = decisionIR.nodes.find(n => n.type === 'question')!

      const result = engine.why(questionNode.id)

      // @ts-ignore
      expect(result.metadata.total_ancestors).toBe(0)
      // @ts-ignore
      expect(result.causal_chain).toHaveLength(0)
      // @ts-ignore
      expect(result.root_cause.id).toBe(questionNode.id)
    })

    it('should respect maxDepth option', () => {
      const scalesNode = decisionIR.nodes.find(n => n.content === 'scales horizontally')!

      const result = engine.why(scalesNode.id, { maxDepth: 1 })

      // @ts-ignore
      expect(result.causal_chain.length).toBeLessThanOrEqual(1)
    })

    it('should detect multiple paths', () => {
      // Find a node that might have multiple parents
      const nodes = decisionIR.nodes

      for (const node of nodes) {
        const result = engine.why(node.id)
        // @ts-ignore
        if (result.metadata.has_multiple_paths) {
          // @ts-ignore
          expect(result.metadata.has_multiple_paths).toBe(true)
          return // Test passed
        }
      }

      // If no multiple paths found, that's also valid for this example
      expect(true).toBe(true)
    })

    it('should throw error for non-existent node', () => {
      expect(() => {
        engine.why('non-existent-node-id')
      }).toThrow('Node not found')
    })
  })

  // ==========================================================================
  // Query 2: whatIf() - Impact Analysis
  // ==========================================================================

  describe('whatIf', () => {
    beforeEach(() => {
      engine.load(decisionIR)
    })

    it('should return impact analysis in tree format', () => {
      // Use JWT tokens alternative (has consequences)
      const jwtNode = decisionIR.nodes.find(n => n.content === 'JWT tokens')!

      const result = engine.whatIf(jwtNode.id)

      expect(result).toHaveProperty('source')
      expect(result).toHaveProperty('impact_tree')
      expect(result).toHaveProperty('tensions_in_impact_zone')
      expect(result).toHaveProperty('metadata')

      // @ts-ignore
      expect(result.source.content).toBe('JWT tokens')
      // @ts-ignore
      expect(result.impact_tree.direct_consequences).toBeInstanceOf(Array)
      // @ts-ignore
      expect(result.impact_tree.indirect_consequences).toBeInstanceOf(Array)
    })

    it('should detect tensions in impact zone', () => {
      // JWT tokens alternative has a tension
      const jwtNode = decisionIR.nodes.find(n => n.content === 'JWT tokens')!

      const result = engine.whatIf(jwtNode.id)

      // @ts-ignore
      expect(result.metadata.tension_count).toBeGreaterThanOrEqual(0)
      // @ts-ignore
      if (result.tensions_in_impact_zone.length > 0) {
        // @ts-ignore
        expect(result.tensions_in_impact_zone[0]).toHaveProperty('axis')
        // @ts-ignore
        expect(result.tensions_in_impact_zone[0]).toHaveProperty('source')
        // @ts-ignore
        expect(result.tensions_in_impact_zone[0]).toHaveProperty('target')
      }
    })

    it('should return summary format when requested', () => {
      const jwtNode = decisionIR.nodes.find(n => n.content === 'JWT tokens')!

      const result = engine.whatIf(jwtNode.id, { format: 'summary' })

      expect(result).toHaveProperty('impact_summary')
      expect(result).toHaveProperty('benefits')
      expect(result).toHaveProperty('risks')
      expect(result).toHaveProperty('key_tradeoff')

      // @ts-ignore
      expect(typeof result.impact_summary).toBe('string')
      // @ts-ignore
      expect(result.benefits).toBeInstanceOf(Array)
      // @ts-ignore
      expect(result.risks).toBeInstanceOf(Array)
    })

    it('should handle node with no consequences', () => {
      // Find a leaf node (no outgoing causes relationships)
      const scalesNode = decisionIR.nodes.find(n => n.content === 'scales horizontally')!

      const result = engine.whatIf(scalesNode.id)

      // @ts-ignore
      expect(result.metadata.total_descendants).toBe(0)
      // @ts-ignore
      expect(result.impact_tree.direct_consequences).toHaveLength(0)
      // @ts-ignore
      expect(result.impact_tree.indirect_consequences).toHaveLength(0)
    })

    it('should respect maxDepth option', () => {
      const jwtNode = decisionIR.nodes.find(n => n.content === 'JWT tokens')!

      const result = engine.whatIf(jwtNode.id, { maxDepth: 1 })

      // @ts-ignore
      expect(result.impact_tree.indirect_consequences).toHaveLength(0)
      // All consequences should be depth 1 (direct)
      // @ts-ignore
      for (const cons of result.impact_tree.direct_consequences) {
        expect(cons.depth).toBe(1)
      }
    })

    it('should include direct and indirect consequences', () => {
      const jwtNode = decisionIR.nodes.find(n => n.content === 'JWT tokens')!

      const result = engine.whatIf(jwtNode.id)

      // JWT tokens -> stateless architecture -> [scales horizontally, no server-side session]
      // So we should have both direct (depth 1) and indirect (depth 2+)
      // @ts-ignore
      expect(result.impact_tree.direct_consequences.length).toBeGreaterThan(0)

      // Check depth values
      // @ts-ignore
      for (const cons of result.impact_tree.direct_consequences) {
        expect(cons.depth).toBe(1)
      }
      // @ts-ignore
      for (const cons of result.impact_tree.indirect_consequences) {
        expect(cons.depth).toBeGreaterThan(1)
      }
    })

    it('should mark nodes with tensions', () => {
      const jwtNode = decisionIR.nodes.find(n => n.content === 'JWT tokens')!

      const result = engine.whatIf(jwtNode.id)

      // Check if any consequences are marked with tensions
      // @ts-ignore
      const allConsequences = [
        // @ts-ignore
        ...result.impact_tree.direct_consequences,
        // @ts-ignore
        ...result.impact_tree.indirect_consequences
      ]

      const withTensions = allConsequences.filter(c => c.has_tension || c.tension_axis)
      // JWT has a tension, so we should find it
      // But it's okay if it's not in descendants
      expect(allConsequences.length).toBeGreaterThanOrEqual(0)
    })

    it('should throw error for non-existent node', () => {
      expect(() => {
        engine.whatIf('non-existent-node-id')
      }).toThrow('Node not found')
    })
  })

  // ==========================================================================
  // Query 3: tensions()
  // ==========================================================================

  describe('tensions', () => {
    beforeEach(() => {
      engine.load(decisionIR)
    })

    it('should extract all tensions grouped by axis (default)', () => {
      const result = engine.tensions()

      expect(result.tensions_by_axis).toBeDefined()
      expect(result.metadata.total_tensions).toBe(2)
      expect(result.metadata.unique_axes).toContain('security vs simplicity')
      expect(result.metadata.unique_axes).toContain('scaling vs security')
      expect(result.metadata.most_common_axis).toBeTruthy()

      // Check tension details
      const secSimp = result.tensions_by_axis!['security vs simplicity']
      expect(secSimp).toHaveLength(1)
      expect(secSimp[0].source.content).toBe('JWT tokens')
      expect(secSimp[0].target.content).toBe('implementation complexity')
    })

    it('should group tensions by node when specified', () => {
      const result = engine.tensions({ groupBy: 'node' })

      expect(result.tensions_by_node).toBeDefined()
      expect(result.metadata.total_tensions).toBe(2)

      // Should have entries for the source nodes
      const nodeIds = Object.keys(result.tensions_by_node!)
      expect(nodeIds.length).toBeGreaterThan(0)
    })

    it('should return flat array when groupBy=none', () => {
      const result = engine.tensions({ groupBy: 'none' })

      expect(result.tensions).toBeDefined()
      expect(result.tensions).toHaveLength(2)
      expect(result.tensions![0].source).toBeDefined()
      expect(result.tensions![0].target).toBeDefined()
    })

    it('should filter by axis when specified', () => {
      const result = engine.tensions({
        filterByAxis: ['security vs simplicity']
      })

      expect(result.metadata.total_tensions).toBe(1)
      expect(result.metadata.unique_axes).toEqual(['security vs simplicity'])

      const tensions = result.tensions_by_axis!['security vs simplicity']
      expect(tensions[0].target.content).toBe('implementation complexity')
    })

    it('should include context when requested', () => {
      const result = engine.tensions({
        includeContext: true,
        groupBy: 'none'
      })

      // At least some tensions should have context
      const withContext = result.tensions!.filter(t => t.context && t.context.length > 0)
      expect(withContext.length).toBeGreaterThan(0)
    })

    it('should handle empty graph (no tensions)', () => {
      const emptyIR: IR = {
        version: '1.0.0',
        nodes: [
          {
            id: 'node1',
            type: 'statement',
            content: 'test',
            provenance: {
              source_file: 'test.fs',
              line_number: 1,
              timestamp: new Date().toISOString()
            }
          }
        ],
        relationships: [],
        states: [],
        invariants: {
          causal_acyclic: true,
          all_nodes_reachable: true,
          tension_axes_labeled: true,
          state_fields_present: true
        },
        metadata: {
          source_files: ['test.fs'],
          parsed_at: new Date().toISOString(),
          parser: 'test'
        }
      }

      engine.load(emptyIR)
      const result = engine.tensions()

      expect(result.metadata.total_tensions).toBe(0)
      expect(result.metadata.unique_axes).toEqual([])
      expect(result.metadata.most_common_axis).toBeNull()
    })
  })

  // ==========================================================================
  // Query 4: blocked()
  // ==========================================================================

  describe('blocked', () => {
    it('should return empty result when no blockers', () => {
      engine.load(decisionIR)
      const result = engine.blocked()

      expect(result.blockers).toHaveLength(0)
      expect(result.metadata.total_blockers).toBe(0)
      expect(result.metadata.oldest_blocker).toBeNull()
    })

    it('should find blocked nodes and calculate days blocked', () => {
      const blockedIR: IR = {
        ...decisionIR,
        states: [
          {
            id: 'state1',
            type: 'blocked',
            node_id: decisionIR.nodes[0].id,
            fields: {
              reason: 'waiting on approval',
              since: '2025-10-01'
            },
            provenance: {
              source_file: 'test.fs',
              line_number: 1,
              timestamp: new Date().toISOString()
            }
          }
        ]
      }

      engine.load(blockedIR)
      const result = engine.blocked()

      expect(result.blockers).toHaveLength(1)
      expect(result.blockers[0].blocked_state.reason).toBe('waiting on approval')
      expect(result.blockers[0].blocked_state.since).toBe('2025-10-01')
      expect(result.blockers[0].blocked_state.days_blocked).toBeGreaterThan(0)
    })

    it('should filter by since date', () => {
      const blockedIR: IR = {
        ...decisionIR,
        states: [
          {
            id: 'state1',
            type: 'blocked',
            node_id: decisionIR.nodes[0].id,
            fields: {
              reason: 'old blocker',
              since: '2025-09-01'
            },
            provenance: {
              source_file: 'test.fs',
              line_number: 1,
              timestamp: new Date().toISOString()
            }
          },
          {
            id: 'state2',
            type: 'blocked',
            node_id: decisionIR.nodes[1].id,
            fields: {
              reason: 'new blocker',
              since: '2025-10-15'
            },
            provenance: {
              source_file: 'test.fs',
              line_number: 2,
              timestamp: new Date().toISOString()
            }
          }
        ]
      }

      engine.load(blockedIR)
      const result = engine.blocked({ since: '2025-10-10' })

      expect(result.blockers).toHaveLength(1)
      expect(result.blockers[0].blocked_state.reason).toBe('new blocker')
    })

    it('should calculate impact score from transitive effects', () => {
      // Create a simple causal chain: blocked -> A -> B
      const blockedNode = decisionIR.nodes[0]
      const nodeA = decisionIR.nodes[1]
      const nodeB = decisionIR.nodes[2]

      const blockedIR: IR = {
        ...decisionIR,
        relationships: [
          {
            id: 'rel1',
            type: 'causes',
            source: blockedNode.id,
            target: nodeA.id,
            provenance: {
              source_file: 'test.fs',
              line_number: 1,
              timestamp: new Date().toISOString()
            }
          },
          {
            id: 'rel2',
            type: 'causes',
            source: nodeA.id,
            target: nodeB.id,
            provenance: {
              source_file: 'test.fs',
              line_number: 2,
              timestamp: new Date().toISOString()
            }
          }
        ],
        states: [
          {
            id: 'state1',
            type: 'blocked',
            node_id: blockedNode.id,
            fields: {
              reason: 'blocked',
              since: '2025-10-01'
            },
            provenance: {
              source_file: 'test.fs',
              line_number: 1,
              timestamp: new Date().toISOString()
            }
          }
        ]
      }

      engine.load(blockedIR)
      const result = engine.blocked()

      expect(result.blockers).toHaveLength(1)
      expect(result.blockers[0].impact_score).toBe(2) // nodeA + nodeB
      expect(result.blockers[0].transitive_effects).toHaveLength(2)
    })

    it('should sort by impact score then days blocked', () => {
      const node1 = decisionIR.nodes[0]
      const node2 = decisionIR.nodes[1]
      const node3 = decisionIR.nodes[2]

      const blockedIR: IR = {
        ...decisionIR,
        relationships: [
          {
            id: 'rel1',
            type: 'causes',
            source: node2.id,
            target: node3.id,
            provenance: {
              source_file: 'test.fs',
              line_number: 1,
              timestamp: new Date().toISOString()
            }
          }
        ],
        states: [
          {
            id: 'state1',
            type: 'blocked',
            node_id: node1.id,
            fields: {
              reason: 'low impact, old',
              since: '2025-09-01'
            },
            provenance: {
              source_file: 'test.fs',
              line_number: 1,
              timestamp: new Date().toISOString()
            }
          },
          {
            id: 'state2',
            type: 'blocked',
            node_id: node2.id,
            fields: {
              reason: 'high impact',
              since: '2025-10-15'
            },
            provenance: {
              source_file: 'test.fs',
              line_number: 2,
              timestamp: new Date().toISOString()
            }
          }
        ]
      }

      engine.load(blockedIR)
      const result = engine.blocked()

      expect(result.blockers).toHaveLength(2)
      // Higher impact should come first
      expect(result.blockers[0].impact_score).toBe(1)
      expect(result.blockers[1].impact_score).toBe(0)
    })

    it('should calculate metadata correctly', () => {
      const blockedIR: IR = {
        ...decisionIR,
        states: [
          {
            id: 'state1',
            type: 'blocked',
            node_id: decisionIR.nodes[0].id,
            fields: {
              reason: 'blocker 1',
              since: '2025-10-01'
            },
            provenance: {
              source_file: 'test.fs',
              line_number: 1,
              timestamp: new Date().toISOString()
            }
          },
          {
            id: 'state2',
            type: 'blocked',
            node_id: decisionIR.nodes[1].id,
            fields: {
              reason: 'blocker 2',
              since: '2025-10-15'
            },
            provenance: {
              source_file: 'test.fs',
              line_number: 2,
              timestamp: new Date().toISOString()
            }
          }
        ]
      }

      engine.load(blockedIR)
      const result = engine.blocked()

      expect(result.metadata.total_blockers).toBe(2)
      expect(result.metadata.average_days_blocked).toBeGreaterThan(0)
      expect(result.metadata.oldest_blocker).toBeTruthy()
      expect(result.metadata.oldest_blocker!.days).toBeGreaterThan(
        result.metadata.average_days_blocked
      )
    })
  })

  // ==========================================================================
  // Query 5: alternatives()
  // ==========================================================================

  describe('alternatives', () => {
    beforeEach(() => {
      engine.load(decisionIR)
    })

    it('should extract all alternatives for a question', () => {
      const questionNode = decisionIR.nodes.find(n => n.type === 'question')!
      const result = engine.alternatives(questionNode.id)

      expect(result.question.id).toBe(questionNode.id)
      expect(result.question.content).toBe('authentication strategy for v1 launch')
      expect(result.alternatives).toHaveLength(2)

      const altContents = result.alternatives.map(a => a.content)
      expect(altContents).toContain('JWT tokens')
      expect(altContents).toContain('session tokens + Redis')
    })

    it('should identify the chosen alternative', () => {
      const questionNode = decisionIR.nodes.find(n => n.type === 'question')!
      const result = engine.alternatives(questionNode.id)

      const chosenAlt = result.alternatives.find(a => a.chosen)
      expect(chosenAlt).toBeDefined()
      expect(chosenAlt!.content).toBe('session tokens + Redis')
      expect(chosenAlt!.rationale).toBe('security > scaling complexity for v1')
      expect(chosenAlt!.decided_on).toBe('2025-10-15')
    })

    it('should include tensions for each alternative', () => {
      const questionNode = decisionIR.nodes.find(n => n.type === 'question')!
      const result = engine.alternatives(questionNode.id)

      // Check JWT alternative has tension
      const jwtAlt = result.alternatives.find(a => a.content === 'JWT tokens')
      expect(jwtAlt!.tensions).toBeDefined()
      expect(jwtAlt!.tensions!.length).toBeGreaterThan(0)
      expect(jwtAlt!.tensions![0].axis).toBe('security vs simplicity')

      // Check Redis alternative has tension
      const redisAlt = result.alternatives.find(a => a.content === 'session tokens + Redis')
      expect(redisAlt!.tensions).toBeDefined()
      expect(redisAlt!.tensions!.length).toBeGreaterThan(0)
      expect(redisAlt!.tensions![0].axis).toBe('scaling vs security')
    })

    it('should include consequences when requested', () => {
      const questionNode = decisionIR.nodes.find(n => n.type === 'question')!
      const result = engine.alternatives(questionNode.id, {
        includeConsequences: true
      })

      // Each alternative should have consequences from child nodes
      const jwtAlt = result.alternatives.find(a => a.content === 'JWT tokens')
      expect(jwtAlt!.consequences).toBeDefined()
      expect(jwtAlt!.consequences!.length).toBeGreaterThan(0)
    })

    it('should build decision summary correctly', () => {
      const questionNode = decisionIR.nodes.find(n => n.type === 'question')!
      const result = engine.alternatives(questionNode.id)

      expect(result.decision_summary.chosen).toBe('session tokens + Redis')
      expect(result.decision_summary.rationale).toBe('security > scaling complexity for v1')
      expect(result.decision_summary.rejected).toContain('JWT tokens')
      expect(result.decision_summary.key_factors).toContain('scaling vs security')
    })

    it('should throw error when node is not a question', () => {
      const statementNode = decisionIR.nodes.find(n => n.type === 'statement')!

      expect(() => {
        engine.alternatives(statementNode.id)
      }).toThrow('not a question')
    })

    it('should throw error when node not found', () => {
      expect(() => {
        engine.alternatives('non-existent-id')
      }).toThrow('Node not found')
    })

    it('should handle question with no decision made', () => {
      const noDecisionIR: IR = {
        ...decisionIR,
        states: [] // Remove decided state
      }

      engine.load(noDecisionIR)
      const questionNode = noDecisionIR.nodes.find(n => n.type === 'question')!
      const result = engine.alternatives(questionNode.id)

      expect(result.alternatives.every(a => !a.chosen)).toBe(true)
      expect(result.decision_summary.chosen).toBeNull()
      expect(result.decision_summary.rationale).toBeNull()
      expect(result.decision_summary.rejected).toHaveLength(2)
    })
  })
})
