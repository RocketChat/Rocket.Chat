import type { INotificationDesktop } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { PreferencesPage } from '@rocket.chat/ui-account';
import { useTranslation } from 'react-i18next';

import { useNotification } from '../../../hooks/notification/useNotification';

const AccountPreferencesRoute = () => {
	const { t } = useTranslation();
	const notify = useNotification();

	const sendTestNotification = useStableCallback(() => {
		void notify({
			payload: {
				sender: { _id: 'rocket.cat', username: 'rocket.cat' },
				rid: 'GENERAL',
			} as INotificationDesktop['payload'],
			title: t('Desktop_Notification_Test'),
			text: t('This_is_a_desktop_notification'),
		});
	});

	return <PreferencesPage sendTestNotification={sendTestNotification} />;
};

export default AccountPreferencesRoute;
