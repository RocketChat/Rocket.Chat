import { json } from '@codemirror/lang-json';
import { EditorView } from 'codemirror';

import highlightStyle from './HighlightStyle';
import basicSetup from './basicSetup';
import jsonLinter from './jsonLinter';
// import payloadLinter from './payloadLinter';
import theme from './theme';

export const actionBlockExtensions = [
  highlightStyle,
  json(),
  jsonLinter,
  basicSetup,
  // payloadLinter,
  ...theme,
];

export const actionPreviewExtensions = [
  EditorView.contentAttributes.of({ contenteditable: 'false' }),
  highlightStyle,
  json(),
  basicSetup,
  ...theme,
];
