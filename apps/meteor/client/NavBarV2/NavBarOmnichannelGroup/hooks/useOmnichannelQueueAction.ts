import type { Keys } from '@rocket.chat/icons';
import { useCurrentRoutePath, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useOmnichannelShowQueueLink } from '../../../hooks/omnichannel/useOmnichannelShowQueueLink';

export const useOmnichannelQueueAction = () => {
	const { t } = useTranslation();
	const showOmnichannelQueueLink = useOmnichannelShowQueueLink();

	const router = useRouter();
	const currentRoute = useCurrentRoutePath();

	return {
		isEnabled: showOmnichannelQueueLink,
		icon: 'queue' as Keys,
		title: t('Queue'),
		handleGoToQueue: () => router.navigate('/livechat-queue'),
		isPressed: currentRoute?.includes('/livechat-queue') || false,
	};
};
