/**
 * FlowScript Serializer Tests
 *
 * Tests IR → .fs serialization and round-trip fidelity.
 * The key invariant: parse(serialize(parse(input))) should produce
 * a semantically equivalent IR to parse(input).
 */

import { Parser } from '../src/parser';
import { serialize } from '../src/serializer';
import { IR } from '../src/types';

function parse(input: string): IR {
  const parser = new Parser('test.fs');
  return parser.parse(input);
}

function roundTrip(input: string): { original: IR; serialized: string; reparsed: IR } {
  const original = parse(input);
  const serialized = serialize(original);
  const reparsed = parse(serialized);
  return { original, serialized, reparsed };
}

/**
 * Compare two IRs for semantic equivalence.
 * Ignores: provenance (line numbers change), IDs (content-hash so same if content same),
 * metadata, block nodes (structural artifacts).
 */
function semanticNodes(ir: IR) {
  return ir.nodes
    .filter(n => n.type !== 'block')
    .map(n => ({
      type: n.type,
      content: n.content,
      modifiers: n.modifiers,
      childCount: n.children?.length ?? 0,
    }))
    .sort((a, b) => a.content.localeCompare(b.content));
}

function semanticRelationships(ir: IR) {
  // Map IDs to content for comparison
  const nodeContent = new Map<string, string>();
  for (const n of ir.nodes) {
    nodeContent.set(n.id, n.content || `[block]`);
  }
  return ir.relationships
    .map(r => ({
      type: r.type,
      source: nodeContent.get(r.source) ?? r.source,
      target: nodeContent.get(r.target) ?? r.target,
      axis_label: r.axis_label ?? null,
    }))
    .sort((a, b) =>
      a.type.localeCompare(b.type) ||
      a.source.localeCompare(b.source) ||
      a.target.localeCompare(b.target)
    );
}

function semanticStates(ir: IR) {
  const nodeContent = new Map<string, string>();
  for (const n of ir.nodes) {
    nodeContent.set(n.id, n.content || `[block]`);
  }
  return ir.states
    .map(s => ({
      type: s.type,
      node: nodeContent.get(s.node_id) ?? s.node_id,
      fields: s.fields,
    }))
    .sort((a, b) => a.type.localeCompare(b.type) || a.node.localeCompare(b.node));
}

// ============================================================================
// Basic Serialization Tests
// ============================================================================

describe('Serializer - Basic', () => {
  test('serializes a simple statement', () => {
    const input = 'hello world\n';
    const ir = parse(input);
    const output = serialize(ir);
    expect(output.trim()).toBe('hello world');
  });

  test('serializes a question', () => {
    const input = '? what should we do\n';
    const ir = parse(input);
    const output = serialize(ir);
    expect(output.trim()).toBe('? what should we do');
  });

  test('serializes a thought', () => {
    const input = 'thought: this is interesting\n';
    const ir = parse(input);
    const output = serialize(ir);
    expect(output.trim()).toBe('thought: this is interesting');
  });

  test('serializes an action', () => {
    const input = 'action: deploy the thing\n';
    const ir = parse(input);
    const output = serialize(ir);
    expect(output.trim()).toBe('action: deploy the thing');
  });

  test('serializes a completion', () => {
    const input = '✓ task done\n';
    const ir = parse(input);
    const output = serialize(ir);
    expect(output.trim()).toBe('✓ task done');
  });

  test('serializes modifiers', () => {
    const input = '! urgent thing\n';
    const ir = parse(input);
    const output = serialize(ir);
    expect(output.trim()).toBe('! urgent thing');
  });

  test('serializes multiple modifiers', () => {
    const input = '! * important and confident\n';
    const ir = parse(input);
    const output = serialize(ir);
    expect(output.trim()).toContain('important and confident');
    // Should have both ! and * modifiers
    const reparsed = parse(output);
    const node = reparsed.nodes.find(n => n.type !== 'block');
    expect(node?.modifiers).toContain('urgent');
    expect(node?.modifiers).toContain('high_confidence');
  });
});

// ============================================================================
// Relationship Tests
// ============================================================================

describe('Serializer - Relationships', () => {
  test('serializes a simple causal chain', () => {
    const input = 'cause -> effect\n';
    const ir = parse(input);
    const output = serialize(ir);
    const reparsed = parse(output);
    // Should have a causes relationship
    const rels = semanticRelationships(reparsed);
    expect(rels.length).toBeGreaterThanOrEqual(1);
    expect(rels.some(r => r.type === 'causes')).toBe(true);
  });

  test('serializes tension with axis label', () => {
    const input = 'speed ><[quality vs velocity] thoroughness\n';
    const ir = parse(input);
    const output = serialize(ir);
    const reparsed = parse(output);
    const rels = semanticRelationships(reparsed);
    expect(rels.some(r => r.type === 'tension' && r.axis_label === 'quality vs velocity')).toBe(true);
  });

  test('serializes temporal relationship', () => {
    const input = 'first step => second step\n';
    const ir = parse(input);
    const output = serialize(ir);
    const reparsed = parse(output);
    const rels = semanticRelationships(reparsed);
    expect(rels.some(r => r.type === 'temporal')).toBe(true);
  });
});

// ============================================================================
// State Tests
// ============================================================================

describe('Serializer - States', () => {
  test('serializes decided with fields', () => {
    const input = '[decided(rationale: "good idea", on: "2025-10-14")] the decision\n';
    const ir = parse(input);
    const output = serialize(ir);
    expect(output).toContain('[decided(rationale: "good idea", on: "2025-10-14")]');
    expect(output).toContain('the decision');
  });

  test('serializes blocked with fields', () => {
    const input = '[blocked(reason: "waiting on API", since: "2025-10-16")] the task\n';
    const ir = parse(input);
    const output = serialize(ir);
    expect(output).toContain('[blocked(reason: "waiting on API", since: "2025-10-16")]');
  });

  test('serializes decided without fields', () => {
    const input = '[decided] ship it\n';
    const ir = parse(input);
    const output = serialize(ir);
    expect(output).toContain('[decided]');
    expect(output).toContain('ship it');
  });

  test('serializes exploring', () => {
    const input = '[exploring] new approach\n';
    const ir = parse(input);
    const output = serialize(ir);
    expect(output).toContain('[exploring]');
  });

  test('renders state on separate line when provenance differs from node', () => {
    // In debug.fs, [blocked] is on line 7 but its target action is on line 9
    // The serializer should preserve this separation
    const input = `[blocked(reason: "waiting", since: "2025-10-16")]

action: do the thing
`;
    const ir = parse(input);
    const output = serialize(ir);

    // State should be on its own line, not inline with the action
    const lines = output.trim().split('\n');
    const blockedLine = lines.find(l => l.includes('[blocked'));
    const actionLine = lines.find(l => l.includes('action:'));
    expect(blockedLine).toBeDefined();
    expect(actionLine).toBeDefined();
    expect(blockedLine).not.toBe(actionLine);
    // The blocked line should NOT contain the action content
    expect(blockedLine).not.toContain('action:');
  });

  test('renders state inline when on same line as node', () => {
    const input = `[decided(rationale: "good", on: "2025-10-14")] the choice
`;
    const ir = parse(input);
    const output = serialize(ir);
    // State should be inline — same line as content
    const lines = output.trim().split('\n').filter(l => l.trim().length > 0);
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('[decided');
    expect(lines[0]).toContain('the choice');
  });

  test('preserves fields on unknown state types via generic passthrough', () => {
    // The parser produces 'completed' states from [completed(on: "...")] syntax,
    // but 'completed' isn't in the StateType union. The serializer should preserve
    // all fields generically rather than dropping them.
    const ir: IR = {
      version: '1.0.0',
      nodes: [
        { id: 'a', type: 'completion', content: 'task done', provenance: { source_file: 'test.fs', line_number: 1, timestamp: '' } },
      ],
      relationships: [],
      states: [
        { id: 's1', type: 'completed' as any, node_id: 'a', fields: { on: '2025-10-15' }, provenance: { source_file: 'test.fs', line_number: 1, timestamp: '' } },
      ],
      invariants: {},
    };
    const output = serialize(ir);
    expect(output).toContain('[completed(on: "2025-10-15")]');
  });
});

// ============================================================================
// Nesting / Children Tests
// ============================================================================

describe('Serializer - Nesting', () => {
  test('serializes question with alternatives', () => {
    const input = `? which database
|| PostgreSQL
|| MongoDB
`;
    const ir = parse(input);
    const output = serialize(ir);
    expect(output).toContain('? which database');
    expect(output).toContain('|| PostgreSQL');
    expect(output).toContain('|| MongoDB');
  });

  test('serializes thought with indented children', () => {
    const input = `thought: cache strategy
  -> implement TTL
  -> add jitter
`;
    const ir = parse(input);
    const output = serialize(ir);
    const reparsed = parse(output);

    // Should preserve the thought
    const thoughts = reparsed.nodes.filter(n => n.type === 'thought');
    expect(thoughts.length).toBe(1);
    expect(thoughts[0].content).toBe('cache strategy');
  });
});

// ============================================================================
// Round-Trip Tests
// ============================================================================

describe('Serializer - Round Trip', () => {
  test('round-trips a simple document', () => {
    const input = `? which approach
|| option A
|| option B
`;
    const { original, reparsed } = roundTrip(input);

    // Same non-block nodes
    const origNodes = semanticNodes(original);
    const reNodes = semanticNodes(reparsed);
    expect(reNodes.length).toBe(origNodes.length);
    for (let i = 0; i < origNodes.length; i++) {
      expect(reNodes[i].type).toBe(origNodes[i].type);
      expect(reNodes[i].content).toBe(origNodes[i].content);
    }

    // Same relationships
    const origRels = semanticRelationships(original);
    const reRels = semanticRelationships(reparsed);
    expect(reRels.length).toBe(origRels.length);
  });

  test('round-trips states', () => {
    const input = `[decided(rationale: "best option", on: "2025-10-14")] use Redis
`;
    const { original, reparsed } = roundTrip(input);

    const origStates = semanticStates(original);
    const reStates = semanticStates(reparsed);
    expect(reStates.length).toBe(origStates.length);
    expect(reStates[0].type).toBe(origStates[0].type);
    expect(reStates[0].fields).toEqual(origStates[0].fields);
  });

  test('round-trips modifiers', () => {
    const input = `! critical issue
`;
    const { original, reparsed } = roundTrip(input);
    const origNodes = semanticNodes(original);
    const reNodes = semanticNodes(reparsed);
    expect(reNodes[0].modifiers).toEqual(origNodes[0].modifiers);
  });

  test('round-trips causal chain', () => {
    const input = `root cause -> first effect -> second effect
`;
    const { original, reparsed } = roundTrip(input);
    const origRels = semanticRelationships(original);
    const reRels = semanticRelationships(reparsed);
    expect(reRels.length).toBe(origRels.length);
    for (let i = 0; i < origRels.length; i++) {
      expect(reRels[i].type).toBe(origRels[i].type);
    }
  });

  test('round-trips reverse causal', () => {
    const input = `symptom <- root cause
`;
    const { original, reparsed } = roundTrip(input);
    const origRels = semanticRelationships(original);
    const reRels = semanticRelationships(reparsed);
    expect(reRels.length).toBe(origRels.length);
    expect(reRels[0].type).toBe('derives_from');
  });

  test('round-trips bidirectional', () => {
    const input = `A <-> B
`;
    const { original, reparsed } = roundTrip(input);
    const origRels = semanticRelationships(original);
    const reRels = semanticRelationships(reparsed);
    expect(reRels.length).toBe(origRels.length);
    expect(reRels[0].type).toBe('bidirectional');
  });

  test('round-trips tension without axis', () => {
    const input = `speed >< quality
`;
    const { original, reparsed } = roundTrip(input);
    const origRels = semanticRelationships(original);
    const reRels = semanticRelationships(reparsed);
    expect(reRels[0].type).toBe('tension');
    expect(reRels[0].axis_label).toBeNull();
  });

  test('round-trips parking state', () => {
    const input = `[parking(why: "not urgent", until: "2025-12-01")] later task
`;
    const { original, reparsed } = roundTrip(input);
    const origStates = semanticStates(original);
    const reStates = semanticStates(reparsed);
    expect(reStates[0].type).toBe('parking');
    expect(reStates[0].fields).toEqual(origStates[0].fields);
  });

  test('round-trips deep nesting', () => {
    const input = `! root problem
  <- first cause
    <- deeper cause
      <- deepest cause
`;
    const { original, reparsed } = roundTrip(input);
    const origNodes = semanticNodes(original);
    const reNodes = semanticNodes(reparsed);
    expect(reNodes.length).toBe(origNodes.length);
    for (let i = 0; i < origNodes.length; i++) {
      expect(reNodes[i].content).toBe(origNodes[i].content);
    }
  });

  test('round-trips question with alternatives and nested content', () => {
    const input = `? which approach
|| option A
  -> pro 1
  -> pro 2
|| option B
  -> pro 3
`;
    const { original, reparsed } = roundTrip(input);
    const origNodes = semanticNodes(original);
    const reNodes = semanticNodes(reparsed);
    expect(reNodes.length).toBe(origNodes.length);

    const origRels = semanticRelationships(original);
    const reRels = semanticRelationships(reparsed);
    expect(reRels.length).toBe(origRels.length);
  });

  test('serializes equivalent relationship from programmatic IR', () => {
    // equivalent (=) and different (!=) have no grammar rules — they exist
    // only for programmatic IR construction. Verify serializer renders them.
    const { serialize } = require('../src/serializer');
    const { hashContent } = require('../src/hash');
    const ir: IR = {
      version: '1.0.0',
      nodes: [
        { id: 'a', type: 'statement', content: 'this', provenance: { source_file: 'test.fs', line_number: 1, timestamp: '' } },
        { id: 'b', type: 'statement', content: 'that', provenance: { source_file: 'test.fs', line_number: 1, timestamp: '' } },
      ],
      relationships: [
        { id: 'r1', type: 'equivalent', source: 'a', target: 'b', provenance: { source_file: 'test.fs', line_number: 1, timestamp: '' } },
      ],
      states: [],
      invariants: {},
    };
    const output = serialize(ir);
    // The serializer should render = between the nodes
    expect(output).toContain('=');
  });

  test('serializes different relationship from programmatic IR', () => {
    const { serialize } = require('../src/serializer');
    const ir: IR = {
      version: '1.0.0',
      nodes: [
        { id: 'a', type: 'statement', content: 'apples', provenance: { source_file: 'test.fs', line_number: 1, timestamp: '' } },
        { id: 'b', type: 'statement', content: 'oranges', provenance: { source_file: 'test.fs', line_number: 1, timestamp: '' } },
      ],
      relationships: [
        { id: 'r1', type: 'different', source: 'a', target: 'b', provenance: { source_file: 'test.fs', line_number: 1, timestamp: '' } },
      ],
      states: [],
      invariants: {},
    };
    const output = serialize(ir);
    expect(output).toContain('!=');
  });

  test('round-trips child counts', () => {
    const input = `? which approach
|| option A
  -> pro 1
  -> pro 2
|| option B
  -> pro 3
`;
    const { original, reparsed } = roundTrip(input);
    const origNodes = semanticNodes(original);
    const reNodes = semanticNodes(reparsed);
    // Check child counts match for nodes that have them
    for (const origNode of origNodes) {
      if (origNode.childCount > 0) {
        const match = reNodes.find(n => n.content === origNode.content && n.type === origNode.type);
        expect(match).toBeDefined();
        expect(match!.childCount).toBe(origNode.childCount);
      }
    }
  });

  test('round-trips mixed content types', () => {
    const input = `thought: important insight
  -> leads to this
  action: do the thing
`;
    const { original, reparsed } = roundTrip(input);
    const origNodes = semanticNodes(original);
    const reNodes = semanticNodes(reparsed);
    // Verify types preserved
    for (const origNode of origNodes) {
      const match = reNodes.find(n => n.content === origNode.content);
      expect(match).toBeDefined();
      expect(match!.type).toBe(origNode.type);
    }
  });
});

// ============================================================================
// Typed Relationship Target Tests (grammar extension)
// ============================================================================

describe('Serializer - Typed Relationship Targets', () => {
  test('parses and round-trips -> thought: content', () => {
    const input = `root cause -> thought: important insight
`;
    const ir = parse(input);
    // Should have a thought node
    const thoughts = ir.nodes.filter(n => n.type === 'thought');
    expect(thoughts.length).toBe(1);
    expect(thoughts[0].content).toBe('important insight');
    // Should have a causes relationship
    const rels = ir.relationships.filter(r => r.type === 'causes');
    expect(rels.length).toBe(1);

    // Round-trip
    const { reparsed } = roundTrip(input);
    const reThoughts = reparsed.nodes.filter(n => n.type === 'thought');
    expect(reThoughts.length).toBe(1);
    expect(reThoughts[0].content).toBe('important insight');
    const reRels = reparsed.relationships.filter(r => r.type === 'causes');
    expect(reRels.length).toBe(1);
  });

  test('parses and round-trips -> action: content', () => {
    const input = `problem identified -> action: fix the bug
`;
    const ir = parse(input);
    const actions = ir.nodes.filter(n => n.type === 'action');
    expect(actions.length).toBe(1);
    expect(actions[0].content).toBe('fix the bug');

    const { reparsed } = roundTrip(input);
    const reActions = reparsed.nodes.filter(n => n.type === 'action');
    expect(reActions.length).toBe(1);
  });

  test('parses and round-trips -> ✓ content', () => {
    const input = `task assigned -> ✓ task completed
`;
    const ir = parse(input);
    const completions = ir.nodes.filter(n => n.type === 'completion');
    expect(completions.length).toBe(1);

    const { reparsed } = roundTrip(input);
    const reCompletions = reparsed.nodes.filter(n => n.type === 'completion');
    expect(reCompletions.length).toBe(1);
  });

  test('parses -> thought: in continuation relationships inside blocks', () => {
    const input = `root problem
  -> thought: this is the real issue
  -> action: fix it now
`;
    const ir = parse(input);
    const thoughts = ir.nodes.filter(n => n.type === 'thought');
    expect(thoughts.length).toBe(1);
    const actions = ir.nodes.filter(n => n.type === 'action');
    expect(actions.length).toBe(1);

    // Both should have causes relationships from root
    const causesRels = ir.relationships.filter(r => r.type === 'causes');
    expect(causesRels.length).toBe(2);
  });

  test('round-trips programmatic IR with typed child + relationship', () => {
    // This is the case that was previously broken: a thought node that is
    // both a child AND has a causes relationship from its parent
    const ir: IR = {
      version: '1.0.0',
      nodes: [
        { id: 'parent', type: 'statement', content: 'root cause',
          provenance: { source_file: 'test.fs', line_number: 1, timestamp: '' },
          children: ['child'] },
        { id: 'child', type: 'thought', content: 'key insight',
          provenance: { source_file: 'test.fs', line_number: 2, timestamp: '' } },
      ],
      relationships: [
        { id: 'r1', type: 'causes', source: 'parent', target: 'child',
          provenance: { source_file: 'test.fs', line_number: 2, timestamp: '' } },
      ],
      states: [],
      invariants: {},
    };

    const output = serialize(ir);
    expect(output).toContain('-> thought: key insight');

    // Re-parse and verify both type AND relationship survive
    const reparsed = parse(output);
    const thoughts = reparsed.nodes.filter(n => n.type === 'thought');
    expect(thoughts.length).toBe(1);
    expect(thoughts[0].content).toBe('key insight');
    const causesRels = reparsed.relationships.filter(r => r.type === 'causes');
    expect(causesRels.length).toBe(1);
  });
});

// ============================================================================
// Example File Round-Trip Tests
// ============================================================================

describe('Serializer - Example Files', () => {
  const fs = require('fs');
  const path = require('path');
  const examplesDir = path.join(__dirname, '..', 'examples');

  const exampleFiles = ['debug.fs', 'design.fs', 'research.fs', 'decision.fs'];

  for (const file of exampleFiles) {
    test(`round-trips ${file} relationships`, () => {
      const filePath = path.join(examplesDir, file);
      if (!fs.existsSync(filePath)) return;

      const input = fs.readFileSync(filePath, 'utf-8');
      const { original, reparsed } = roundTrip(input);

      const origRels = semanticRelationships(original);
      const reRels = semanticRelationships(reparsed);
      expect(reRels.length).toBe(origRels.length);
    });

    test(`round-trips ${file} states`, () => {
      const filePath = path.join(examplesDir, file);
      if (!fs.existsSync(filePath)) return;

      const input = fs.readFileSync(filePath, 'utf-8');
      const { original, reparsed } = roundTrip(input);

      const origStates = semanticStates(original);
      const reStates = semanticStates(reparsed);
      expect(reStates.length).toBe(origStates.length);
      for (let i = 0; i < origStates.length; i++) {
        expect(reStates[i].type).toBe(origStates[i].type);
        expect(reStates[i].fields).toEqual(origStates[i].fields);
      }
    });

    test(`round-trips ${file} node types`, () => {
      const filePath = path.join(examplesDir, file);
      if (!fs.existsSync(filePath)) return;

      const input = fs.readFileSync(filePath, 'utf-8');
      const { original, reparsed } = roundTrip(input);

      const origNodes = semanticNodes(original);
      const reNodes = semanticNodes(reparsed);

      // Check all node type+content combos are preserved
      // Use type+content as key to handle duplicate content with different types
      const origSet = new Set(origNodes.map(n => `${n.type}:${n.content}`));
      const reSet = new Set(reNodes.map(n => `${n.type}:${n.content}`));

      for (const key of origSet) {
        expect(reSet.has(key)).toBe(true);
      }
    });
  }
});
