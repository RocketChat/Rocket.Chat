import { useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import hljs, { register } from '../../app/markdown/lib/hljs';

export function useHighlightedCode(language: string, text: string): string {
	const t = useTranslation();
	const { isLoading } = useQuery(['register-highlight-language', language], async () => {
		try {
			await register(language);
			return true;
		} catch (error) {
			console.error('Not possible to register the provided language');
		}
	});

	return useMemo(() => (isLoading ? t('Loading') : hljs.highlight(language, text).value), [isLoading, language, text, t]);
}
