import { useTranslation } from 'react-i18next';

import type { UnreadData } from '../../../lib/getSubscriptionUnreadData';
import { getSubscriptionUnreadData } from '../../../lib/getSubscriptionUnreadData';

export const useUnreadDisplay = (unreadData: UnreadData) => {
	const { t } = useTranslation();

	return getSubscriptionUnreadData(unreadData, t);
};
