// import hljs from 'highlight.js';
import { useMemo } from 'react';

import hljs from '../../app/markdown/lib/hljs';

export function useHighlightedCode(language: string, text: string): unknown {
	return useMemo(() => hljs.highlight(language, text).value, [language, text]);
}
