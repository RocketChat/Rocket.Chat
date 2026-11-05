import { useSetting } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useAutoLinkDomains = (): string[] => {
	const domains = useSetting('Message_CustomDomain_AutoLink', '');

	return useMemo(() => (domains ? domains.split(',').map((domain) => domain.trim()) : []), [domains]);
};
