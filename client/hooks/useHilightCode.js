import hljs from 'highlight.js';
import { useMemo } from 'react';

export function useHilightCode() {
	return (language, text) => useMemo(() => hljs.highlight(language, text).value, [language, text]);
}
