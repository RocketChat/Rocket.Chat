import { usePermission } from '@rocket.chat/ui-contexts';

import { useCurrentChatsHighlight } from './useCurrentChatsHighlight';

export const useOmnichannelHighlight = () => {
	const isLivechatManager = usePermission('view-livechat-manager');
	const { isHighlit } = useCurrentChatsHighlight();

	return { isHighlit: isLivechatManager && isHighlit };
};
