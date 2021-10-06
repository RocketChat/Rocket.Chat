import { useMemo } from 'react';

import hljs from '../../app/markdown/lib/hljs';

export const useHighlightedCode = (language: string, text: string): string =>
	useMemo(() => hljs.highlight(language, text).value, [language, text]);
