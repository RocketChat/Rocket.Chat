import { javascript } from '@codemirror/lang-javascript';

import highlightStyle from './HighlightStyle';
import basicSetup from './basicSetup';
import lint from './lint';
import theme from './theme';

const extensions = [highlightStyle, javascript(), lint, basicSetup, ...theme];

export default extensions;
