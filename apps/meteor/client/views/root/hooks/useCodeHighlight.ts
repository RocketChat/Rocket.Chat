import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { register } from '../../../../app/markdown/lib/hljs';

export const useCodeHighlight = (): void => {
	const codeHighlight = useSetting('Message_Code_highlight');

	useEffect(() => {
		if (typeof codeHighlight === 'string') {
			codeHighlight.split(',').forEach((language: string) => {
				const trimmedLanguage = language.trim();
				if (trimmedLanguage) {
					register(trimmedLanguage);
				}
			});
		}
	}, [codeHighlight]);
};
