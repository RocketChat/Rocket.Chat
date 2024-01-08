import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useAutoLinkDomains = (): string[] => {
	const domains = useSetting<string>('Message_CustomDomain_AutoLink');

	const customDomains = useMemo(() => (domains ? domains.split(',').map((domain) => domain.trim()) : []), [domains]);

	return useMemo(() => {
		return customDomains;
	}, [customDomains]);
};
