import { javascript } from '@codemirror/lang-javascript';

import highlightStyle from './HighlightStyle';
import basicSetup from './basicSetup';
import theme from './theme';

const extensions = [highlightStyle, javascript(), basicSetup, ...theme];

export default extensions;
