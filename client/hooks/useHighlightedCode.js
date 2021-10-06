import { useMemo } from 'react';

import hljs from '../../app/markdown/lib/hljs';

export function useHighlightedCode(language, text) {
	return useMemo(() => hljs.highlight(language, text).value, [language, text]);
}
