import type { Keys } from '@rocket.chat/icons';
import { useCurrentRoutePath, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

export const useOmnichannelContactAction = () => {
	const { t } = useTranslation();
	const router = useRouter();
	const currentRoute = useCurrentRoutePath();

	return {
		icon: 'address-book' as Keys,
		title: t('Contact_Center'),
		handleGoToContactCenter: () => router.navigate('/omnichannel-directory'),
		isPressed: currentRoute?.includes('/omnichannel-directory') || false,
	};
};
