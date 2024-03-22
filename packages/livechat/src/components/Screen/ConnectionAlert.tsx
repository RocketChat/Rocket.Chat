import { useConnectionStatus } from '@rocket.chat/ui-contexts';
import { useEffect } from 'preact/hooks';
import { useTranslation } from 'react-i18next';

import { useAlert } from '../../routes/Chat/hooks/useAlert';

export const useConnectionAlerts = () => {
	const { t } = useTranslation();
	const { status } = useConnectionStatus();

	const { alert } = useAlert();

	useEffect(() => {
		if (status !== 'connected') {
			return alert(t('livechat_is_not_connected'), { error: true });
		}
		return alert(t('livechat_connected'), { timeout: 2000, success: true });
	}, [alert, status, t]);
};
