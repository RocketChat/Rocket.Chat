import { useMemo } from 'react';

import { useMessageListAutoLinkDomains } from '../../../../components/message/list/MessageListContext';

export const useAutoLinkDomains = (): string[] => {
	const domains = useMessageListAutoLinkDomains();

	const customDomains = useMemo(() => (domains ? domains.split(',').map((domain) => domain.trim()) : []), [domains]);

	return useMemo(() => {
		return customDomains;
	}, [customDomains]);
};
