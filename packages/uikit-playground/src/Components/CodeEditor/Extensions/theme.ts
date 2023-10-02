import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

const gutters: Extension = EditorView.theme({
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
    userSelect: 'none',
    minWidth: '32px',
    display: 'flex',
    justifyContent: 'flex-end',
  },

  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
});

const selection: Extension = EditorView.theme({
  '.cm-selectionBackground': {
    backgroundColor: 'var(--RCPG-secondary-color) !important',
    opacity: 0.3,
  },

  '.cm-selectionMatch': {
    backgroundColor: '#74808930 !important',
  },

  '.cm-matchingBracket': {
    backgroundColor: 'transparent !important',
    border: '1px solid #1d74f580',
  },
});

const line: Extension = EditorView.theme({
  '.cm-activeLine': {
    backgroundColor: 'transparent !important',
  },
});

export default [gutters, selection, line] as const;
