import { useTranslation } from 'react-i18next';

import type { UnreadData } from '../../../../sidebar/lib/unreadDisplay';
import { getUnreadDisplay } from '../../../../sidebar/lib/unreadDisplay';

export const useUnreadDisplay = (unreadData: UnreadData) => {
	const { t } = useTranslation();

	return getUnreadDisplay(unreadData, t);
};
