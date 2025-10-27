/**
 * FlowScript Language Mode for CodeMirror 6
 *
 * Defines the FlowScript language as a StreamLanguage
 * that can be used in CodeMirror 6 editors.
 */

import { StreamLanguage } from "@codemirror/language";
import { flowScriptTokenizer } from "./tokenizer";

/**
 * FlowScript language definition for CodeMirror 6
 */
export const flowScript = StreamLanguage.define(flowScriptTokenizer);

/**
 * Language support for FlowScript
 * Can be used directly in CodeMirror extensions array
 */
export function flowScriptLanguage() {
  return flowScript;
}
