import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, usePermission, useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useCallback, useRef, useEffect } from 'react';

import CustomUserActiveConnections from './CustomUserActiveConnections';
import CustomUserStatusFormWithData from './CustomUserStatusFormWithData';
import CustomUserStatusService from './CustomUserStatusService';
import CustomUserStatusTable from './CustomUserStatusTable';
import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarClose,
	ContextualbarTitle,
	ContextualbarDialog,
} from '../../../components/Contextualbar';
import { Page, PageHeader, PageContent } from '../../../components/Page';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const CustomUserStatusRoute = (): ReactElement => {
	const t = useTranslation();
	const route = useRoute('user-status');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const canManageUserStatus = usePermission('manage-user-status');
	const { data: license } = useIsEnterprise();
	const presenceDisabled = useSetting('Presence_broadcast_disabled', false);

	useEffect(() => {
		presenceDisabled && route.push({ context: 'presence-service' });
	}, [presenceDisabled, route]);

	const handleItemClick = (id: string): void => {
		route.push({
			context: 'edit',
			id,
		});
	};

	const handleNewButtonClick = useCallback(() => {
		route.push({ context: 'new' });
	}, [route]);

	const handlePresenceServiceClick = useCallback(() => {
		route.push({ context: 'presence-service' });
	}, [route]);

	const handleClose = useCallback(() => {
		route.push({});
	}, [route]);

	const reload = useRef(() => null);

	const handleReload = useCallback(() => {
		reload.current();
	}, [reload]);

	if (!canManageUserStatus) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page flexDirection='row'>
			<Page name='admin-user-status'>
				<PageHeader title={t('User_Status')}>
					{!license?.isEnterprise && <CustomUserActiveConnections />}
					<ButtonGroup>
						<Button onClick={handlePresenceServiceClick}>{t('Presence_service')}</Button>
						<Button onClick={handleNewButtonClick}>{t('New_custom_status')}</Button>
					</ButtonGroup>
				</PageHeader>
				<PageContent>
					<CustomUserStatusTable reload={reload} onClick={handleItemClick} />
				</PageContent>
			</Page>
			{context && (
				<ContextualbarDialog>
					<Contextualbar>
						<ContextualbarHeader>
							<ContextualbarTitle>
								{context === 'edit' && t('Custom_User_Status_Edit')}
								{context === 'new' && t('Custom_User_Status_Add')}
								{context === 'presence-service' && t('Presence_service_cap')}
							</ContextualbarTitle>
							<ContextualbarClose onClick={handleClose} />
						</ContextualbarHeader>
						{context === 'presence-service' && <CustomUserStatusService />}
						{(context === 'new' || context === 'edit') && (
							<CustomUserStatusFormWithData _id={id} onClose={handleClose} onReload={handleReload} />
						)}
					</Contextualbar>
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default CustomUserStatusRoute;
