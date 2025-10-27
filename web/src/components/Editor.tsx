/**
 * FlowScript Editor Component
 *
 * CodeMirror 6 editor with FlowScript syntax highlighting
 */

import { useEffect, useRef, useState } from "react";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightActiveLine, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { bracketMatching, foldGutter, indentOnInput } from "@codemirror/language";
import { flowScriptLanguage } from "../lib/flowscript/language";
import { flowScriptTheme } from "../lib/flowscript/theme";
import "../styles/Editor.css";

export interface EditorProps {
  /**
   * Initial content of the editor
   */
  initialValue?: string;

  /**
   * Callback when editor content changes
   */
  onChange?: (value: string) => void;

  /**
   * Callback when cursor position changes
   */
  onCursorChange?: (line: number, col: number) => void;

  /**
   * Read-only mode
   */
  readOnly?: boolean;

  /**
   * Additional CSS class names
   */
  className?: string;
}

/**
 * FlowScript Editor Component
 */
export function Editor({
  initialValue = "",
  onChange,
  onCursorChange,
  readOnly = false,
  className = "",
}: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    // Create editor extensions
    const extensions: Extension[] = [
      // Line numbers
      lineNumbers(),

      // Active line highlighting
      highlightActiveLineGutter(),
      highlightActiveLine(),

      // History (undo/redo)
      history(),

      // Bracket matching and auto-closing
      bracketMatching(),
      closeBrackets(),

      // Indentation
      indentOnInput(),

      // Code folding
      foldGutter(),

      // Search
      highlightSelectionMatches(),

      // Autocompletion
      autocompletion(),

      // FlowScript language support
      flowScriptLanguage(),

      // FlowScript theme
      flowScriptTheme(),

      // Keymaps
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
        ...completionKeymap,
        ...closeBracketsKeymap,
      ]),

      // Update callbacks
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange) {
          const value = update.state.doc.toString();
          onChange(value);
        }

        if (update.selectionSet && onCursorChange) {
          const pos = update.state.selection.main.head;
          const line = update.state.doc.lineAt(pos);
          onCursorChange(line.number, pos - line.from);
        }
      }),

      // Read-only if specified
      ...(readOnly ? [EditorState.readOnly.of(true)] : []),
    ];

    // Create editor state
    const state = EditorState.create({
      doc: initialValue,
      extensions,
    });

    // Create editor view
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
    setIsReady(true);

    // Cleanup
    return () => {
      view.destroy();
      viewRef.current = null;
      setIsReady(false);
    };
  }, []); // Only run once on mount

  // Update content if initialValue changes after mount
  useEffect(() => {
    if (isReady && viewRef.current && initialValue !== viewRef.current.state.doc.toString()) {
      const transaction = viewRef.current.state.update({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: initialValue,
        },
      });
      viewRef.current.dispatch(transaction);
    }
  }, [initialValue, isReady]);

  return (
    <div className={`flowscript-editor-wrapper ${className}`}>
      <div ref={editorRef} className="flowscript-editor" />
    </div>
  );
}

/**
 * Export convenience method to get editor value
 */
export function getEditorValue(view: EditorView | null): string {
  return view?.state.doc.toString() || "";
}
