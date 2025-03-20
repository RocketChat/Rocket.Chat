import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import hljs, { register } from '../../app/markdown/lib/hljs';

export function useHighlightedCode(language: string, text: string): string {
	const { t } = useTranslation();
	const { isPending } = useQuery({
		queryKey: ['register-highlight-language', language],

		queryFn: async () => {
			try {
				await register(language);
				return true;
			} catch (error) {
				console.error('Not possible to register the provided language');
			}
		},
	});

	return useMemo(() => (isPending ? t('Loading') : hljs.highlight(language, text).value), [isPending, language, text, t]);
}
