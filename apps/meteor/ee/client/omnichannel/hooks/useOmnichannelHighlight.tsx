import { usePermission } from '@rocket.chat/ui-contexts';

import { useCurrentChatsHighlight } from './useCurrentChatsHighlight';

export const useOmnichannelHighlight = () => {
	const isLivechatManager = usePermission('view-livechat-manager');
	const { isHighlightVisible } = useCurrentChatsHighlight();

	return { isHighlightVisible: isLivechatManager && isHighlightVisible };
};
