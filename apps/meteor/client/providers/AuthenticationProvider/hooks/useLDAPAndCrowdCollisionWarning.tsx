import { useRole, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useLDAPAndCrowdCollisionWarning() {
	const isLdapEnabled = useSetting('LDAP_Enable', false);
	const isCrowdEnabled = useSetting('CROWD_Enable', false);
	const isAdmin = useRole('admin');
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	useEffect(() => {
		if (!isAdmin) return;

		if (isLdapEnabled && isCrowdEnabled) {
			dispatchToastMessage({
				type: 'info',
				message: t('core.LDAP_and_Crowd_cannot_be_enabled_simultaneously'),
			});
		}
	}, [isAdmin, isLdapEnabled, isCrowdEnabled, dispatchToastMessage, t]);
}

