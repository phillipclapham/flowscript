/**
 * FlowScript Grammar Import for Browser
 * Session 7b.2.5: Ohm.js Browser Integration
 *
 * Imports the FlowScript Ohm.js grammar as a raw string using Vite's ?raw suffix.
 * This allows the grammar to be loaded in the browser environment.
 */

// Import grammar file as raw string using Vite's ?raw suffix
// Path: ../../../src/grammar.ohm (relative to repo root)
import grammarSource from '../../../src/grammar.ohm?raw';

export { grammarSource };
