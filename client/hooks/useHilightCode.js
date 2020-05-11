import hljs from 'highlight.js';
import { useCallback } from 'react';

export function useHilightCode() {
	return useCallback((language, text) => hljs.highlight(language, text).value);
}
