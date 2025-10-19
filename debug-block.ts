import { Parser } from './src/parser';
import { Node } from './src/types';

const input = `{
  main idea
  -> { supporting detail 1 }
  -> { supporting detail 2 }
  -> conclusion
}`;
const parser = new Parser('test.fs');
const ir = parser.parse(input);

console.log('=== Debugging: { option A } ><[speed vs reliability] { option B } ===');
console.log('Number of nodes:', ir.nodes.length);
console.log('\nNodes:');
ir.nodes.forEach((n, i) => {
  console.log(`  [${i}] type: ${n.type}, content: "${n.content}", id: ${n.id.substring(0, 8)}...`);
  if (n.ext && 'children' in n.ext && Array.isArray(n.ext.children)) {
    console.log(`      children: ${(n.ext.children as Node[]).length} items`);
  }
  if (n.ext && 'modifiers' in n.ext && Array.isArray(n.ext.modifiers)) {
    console.log(`      modifiers:`, n.ext.modifiers);
  }
});

// Check test condition
const blockNode = ir.nodes.find(n => n.type === 'block');
console.log('\nTest check:');
console.log('  blockNode exists:', !!blockNode);
if (blockNode) {
  console.log('  blockNode.ext?.modifiers:', blockNode.ext?.modifiers, '(expected: contains "urgent")');
}

console.log('\nRelationships:', ir.relationships.length);
ir.relationships.forEach((r, i) => {
  console.log(`  [${i}] ${r.source.substring(0, 8)}... ${r.type} ${r.target.substring(0, 8)}...`);
  console.log(`      axis_label direct:`, r.axis_label);
  console.log(`      ext:`, r.ext);
});

console.log('\nBlock nodes:', ir.nodes.filter(n => n.type === 'block').length);

// Check the specific test condition
const tensions = ir.relationships.filter(r => r.type === 'tension');
console.log('\nTest check:');
console.log('  tensions.length:', tensions.length, '(expected: 1)');
if (tensions.length > 0) {
  console.log('  tensions[0].ext?.axis_label:', tensions[0].ext?.axis_label, '(expected: "speed vs reliability")');
}
