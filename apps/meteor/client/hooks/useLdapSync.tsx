import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetModal, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

export const useLdapSync = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const testConnection = useEndpoint('POST', '/v1/ldap.testConnection');
	const syncNow = useEndpoint('POST', '/v1/ldap.syncNow');
	const closeModal = useStableCallback(() => setModal(null));

	const handleSyncNow = async (): Promise<void> => {
		closeModal();

		try {
			const { message } = await syncNow();
			dispatchToastMessage({ type: 'success', message: t(message as TranslationKey) });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return async (): Promise<void> => {
		try {
			await testConnection();
		} catch {
			dispatchToastMessage({ type: 'error', message: t('Connection_failed') });
			return;
		}

		setModal(
			<GenericModal
				variant='info'
				confirmText={t('Sync')}
				cancelText={t('Cancel')}
				title={t('Execute_Synchronization_Now')}
				onConfirm={handleSyncNow}
				onClose={closeModal}
			>
				{t('LDAP_Sync_Now_Description')}
			</GenericModal>,
		);
	};
};
