import { Box, Button, ButtonGroup, Callout } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericModal, ContextualbarDialog, Page, PageContent, PageHeader } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch, useSetting, useEndpoint, useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { Trans, useTranslation } from 'react-i18next';

import AttributesContextualBar from './ABACAttributesTab/AttributesContextualBar';
import AttributesContextualBarWithData from './ABACAttributesTab/AttributesContextualBarWithData';
import AttributesPage from './ABACAttributesTab/AttributesPage';
import LogsPage from './ABACLogsTab/LogsPage';
import RoomsContextualBar from './ABACRoomsTab/RoomsContextualBar';
import RoomsContextualBarWithData from './ABACRoomsTab/RoomsContextualBarWithData';
import RoomsPage from './ABACRoomsTab/RoomsPage';
import SettingsPage from './ABACSettingTab/SettingsPage';
import AdminABACTabs from './AdminABACTabs';
import { useIsABACAvailable } from './hooks/useIsABACAvailable';
import { useExternalLink } from '../../../hooks/useExternalLink';
import { links } from '../../../lib/links';

type AdminABACPageProps = {
	shouldShowWarning: boolean;
};

const AdminABACPage = ({ shouldShowWarning }: AdminABACPageProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const tab = useRouteParameter('tab');
	const _id = useRouteParameter('id');
	const context = useRouteParameter('context');
	const learnMore = useExternalLink();
	const isABACAvailable = useIsABACAvailable();
	const ldapEnabled = useSetting('LDAP_Enable');
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const testConnection = useEndpoint('POST', '/v1/ldap.testConnection');
	const syncNow = useEndpoint('POST', '/v1/ldap.syncNow');

	const handleSyncNowButtonClick = async (): Promise<void> => {
		try {
			await testConnection();
		} catch {
			dispatchToastMessage({ type: 'error', message: t('Connection_failed') });
			return;
		}

		const confirmSync = async (): Promise<void> => {
			setModal();

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
				onClose={() => setModal()}
			>
				{t('LDAP_Sync_Now_Description')}
			</GenericModal>,
		);
	};

	const handleCloseContextualbar = useEffectEvent((): void => {
		if (!context) {
			return;
		}

		router.navigate(
			{
				name: 'admin-ABAC',
				params: { ...router.getRouteParameters(), context: '', id: '' },
			},
			{ replace: true },
		);
	});

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('ABAC')}>
					<ButtonGroup>
						<Button disabled={!ldapEnabled} onClick={handleSyncNowButtonClick}>
							{t('LDAP_Sync_Now')}
						</Button>
						<Button icon='new-window' secondary onClick={() => learnMore(links.go.abacDocs)}>
							{t('ABAC_Learn_More')}
						</Button>
					</ButtonGroup>
				</PageHeader>
				{shouldShowWarning && (
					<Box mi={24} mb={16}>
						<Callout type='warning' title={t('ABAC_automatically_disabled_callout')}>
							<Trans
								i18nKey='ABAC_automatically_disabled_callout_description'
								components={{
									1: (
										<a href={links.go.abacDocs} rel='noopener noreferrer' target='_blank'>
											ABAC capabilities without restriction.
										</a>
									),
								}}
							/>
						</Callout>
					</Box>
				)}
				<AdminABACTabs />
				<PageContent>
					{tab === 'settings' && <SettingsPage />}
					{tab === 'room-attributes' && <AttributesPage />}
					{tab === 'rooms' && <RoomsPage />}
					{tab === 'logs' && <LogsPage />}
				</PageContent>
			</Page>
			{isABACAvailable === true && tab !== undefined && context !== undefined && (
				<ContextualbarDialog onClose={() => handleCloseContextualbar()}>
					{tab === 'room-attributes' && (
						<>
							{context === 'new' && <AttributesContextualBar onClose={() => handleCloseContextualbar()} />}
							{context === 'edit' && _id && <AttributesContextualBarWithData id={_id} onClose={() => handleCloseContextualbar()} />}
						</>
					)}
					{tab === 'rooms' && (
						<>
							{context === 'new' && <RoomsContextualBar onClose={() => handleCloseContextualbar()} />}
							{context === 'edit' && _id && <RoomsContextualBarWithData id={_id} onClose={() => handleCloseContextualbar()} />}
						</>
					)}
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default AdminABACPage;
