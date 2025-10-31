/**
 * Quick Node.js test for the parser
 * Run with: npx tsx test-parser-node.ts
 */

import { parseFlowScript } from './src/utils/fullFlowScriptParser';
import { irToGraphData, verifyTransformation, logTransformationStats } from './src/utils/irToGraphData';

console.log('🧪 Testing FlowScript Parser\n');

// Test 1: Simple relationship
console.log('Test 1: Simple Relationship');
console.log('----------------------------');
const test1 = parseFlowScript('A -> B -> C');
if (test1.error) {
  console.error('❌ Error:', test1.error);
} else {
  console.log('✅ Parsed successfully');
  const graphData1 = irToGraphData(test1.ir!);
  console.log(`Nodes: ${graphData1.nodes.length}, Edges: ${graphData1.edges.length}`);
  logTransformationStats(test1.ir!, graphData1);
}

// Test 2: Question with alternatives
console.log('\nTest 2: Question with Alternatives');
console.log('------------------------------------');
const test2 = parseFlowScript(`? Should we use React or Vue?
|| React - better ecosystem
|| Vue - simpler learning curve`);
if (test2.error) {
  console.error('❌ Error:', test2.error);
} else {
  console.log('✅ Parsed successfully');
  const graphData2 = irToGraphData(test2.ir!);
  console.log(`Nodes: ${graphData2.nodes.length}, Edges: ${graphData2.edges.length}`);
  const verification2 = verifyTransformation(test2.ir!, graphData2);
  console.log('Verification:', verification2.passed ? '✅ PASSED' : '❌ FAILED');
  if (!verification2.passed) {
    console.log('Errors:', verification2.errors);
  }
}

// Test 3: State markers
console.log('\nTest 3: State Markers');
console.log('----------------------');
const test3 = parseFlowScript(`[decided(rationale: "Best option", on: "2025-10-31")]
Ship the feature

[blocked(reason: "Waiting for review", since: "2025-10-30")]
Deploy to production`);
if (test3.error) {
  console.error('❌ Error:', test3.error);
} else {
  console.log('✅ Parsed successfully');
  const graphData3 = irToGraphData(test3.ir!);
  console.log(`Nodes: ${graphData3.nodes.length}, Edges: ${graphData3.edges.length}, States: ${test3.ir!.states.length}`);
  console.log('Nodes with states:', graphData3.nodes.filter(n => n.state).length);
}

// Test 4: Nested relationships
console.log('\nTest 4: Nested Relationships');
console.log('-----------------------------');
const test4 = parseFlowScript('{A <- B} -> C');
if (test4.error) {
  console.error('❌ Error:', test4.error);
} else {
  console.log('✅ Parsed successfully');
  const graphData4 = irToGraphData(test4.ir!);
  console.log(`Nodes: ${graphData4.nodes.length}, Edges: ${graphData4.edges.length}`);
  console.log('Node types:', [...new Set(graphData4.nodes.map(n => n.type))].join(', '));
}

console.log('\n✅ All tests completed!');
