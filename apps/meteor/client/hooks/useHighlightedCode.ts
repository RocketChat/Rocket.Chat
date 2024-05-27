import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import hljs, { register } from '../../app/markdown/lib/hljs';

export function useHighlightedCode(language: string, text: string): string | undefined {
	const { isLoading } = useQuery(['register-highlight-language', language], async () => {
		try {
			await register(language);
			return true;
		} catch (error) {
			console.error('Not possible to register the language');
		}
	});

	return useMemo(() => (isLoading ? undefined : hljs.highlight(language, text).value), [isLoading, language, text]);
}
