import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from 'react-i18next';

export const useLdapSync = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const testConnection = useEndpoint('POST', '/v1/ldap.testConnection');
	const syncNow = useEndpoint('POST', '/v1/ldap.syncNow');
	const closeModal = useEffectEvent(() => setModal());

	const handleSyncNow = async (): Promise<void> => {
		try {
			await testConnection();
		} catch {
			dispatchToastMessage({ type: 'error', message: t('Connection_failed') });
			return;
		}

		const confirmSync = async (): Promise<void> => {
			closeModal();

			try {
				const { message } = await syncNow();
				dispatchToastMessage({ type: 'success', message: t(message as Parameters<typeof t>[0]) });
			} catch (error) {
				if (error instanceof Error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			}
		};

		setModal(
			<GenericModal
				variant='info'
				confirmText={t('Sync')}
				cancelText={t('Cancel')}
				title={t('Execute_Synchronization_Now')}
				onConfirm={confirmSync}
				onClose={closeModal}
			>
				{t('LDAP_Sync_Now_Description')}
			</GenericModal>,
		);
	};

	return handleSyncNow;
};
