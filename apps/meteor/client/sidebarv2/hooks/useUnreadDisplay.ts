import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { getSubscriptionUnreadData } from '../../../lib/getSubscriptionUnreadData';

export const useUnreadDisplay = (
	unreadData: Pick<
		SubscriptionWithRoom,
		'alert' | 'userMentions' | 'unread' | 'tunread' | 'tunreadUser' | 'groupMentions' | 'hideMentionStatus' | 'hideUnreadStatus'
	>,
) => {
	const { t } = useTranslation();

	return getSubscriptionUnreadData(unreadData, t);
};
