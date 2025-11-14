import { Box, Button, Callout } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { ContextualbarDialog } from '@rocket.chat/ui-client';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { Trans, useTranslation } from 'react-i18next';

import AdminABACLogs from './AdminABACLogs';
import AdminABACRoomAttributes from './AdminABACRoomAttributes';
import AdminABACRooms from './AdminABACRooms';
import AdminABACSettings from './AdminABACSettings';
import AdminABACTabs from './AdminABACTabs';
import RoomAttributesContextualBar from './RoomAttributesContextualBar';
import RoomAttributesContextualBarWithData from './RoomAttributesContextualBarWithData';
import RoomsContextualBar from './RoomsContextualBar';
import RoomsContextualBarWithData from './RoomsContextualBarWithData';
import useIsABACAvailable from './hooks/useIsABACAvailable';
import { Page, PageContent, PageHeader } from '../../../components/Page';
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
					<Button icon='new-window' secondary onClick={() => learnMore(links.go.abacDocs)}>
						{t('ABAC_Learn_More')}
					</Button>
				</PageHeader>
				{shouldShowWarning && (
					<Box mi={24} mb={16}>
						<Callout type='warning' title={t('ABAC_automatically_disabled_callout')}>
							<Trans i18nKey='ABAC_automatically_disabled_callout_description'>
								Renew your license to continue using all{' '}
								<a href={links.go.abacLicenseRenewalUrl} rel='noopener noreferrer' target='_blank'>
									ABAC capabilities without restriction.
								</a>
							</Trans>
						</Callout>
					</Box>
				)}
				<AdminABACTabs />
				<PageContent>
					{tab === 'settings' && <AdminABACSettings />}
					{tab === 'room-attributes' && <AdminABACRoomAttributes />}
					{tab === 'rooms' && <AdminABACRooms />}
					{tab === 'logs' && <AdminABACLogs />}
				</PageContent>
			</Page>
			{tab !== undefined && context !== undefined && (
				<ContextualbarDialog onClose={() => handleCloseContextualbar()}>
					{tab === 'room-attributes' && (
						<>
							{context === 'new' && isABACAvailable === true && <RoomAttributesContextualBar onClose={() => handleCloseContextualbar()} />}
							{context === 'edit' && _id && isABACAvailable === true && (
								<RoomAttributesContextualBarWithData id={_id} onClose={() => handleCloseContextualbar()} />
							)}
						</>
					)}
					{tab === 'rooms' && (
						<>
							{context === 'new' && isABACAvailable === true && <RoomsContextualBar onClose={() => handleCloseContextualbar()} />}
							{context === 'edit' && _id && isABACAvailable === true && (
								<RoomsContextualBarWithData id={_id} onClose={() => handleCloseContextualbar()} />
							)}
						</>
					)}
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default AdminABACPage;
