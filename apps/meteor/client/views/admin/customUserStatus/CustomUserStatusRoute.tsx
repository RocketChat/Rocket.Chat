import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useRef } from 'react';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import CustomUserActiveConnections from './CustomUserActiveConnections';
import CustomUserStatusFormWithData from './CustomUserStatusFormWithData';
import CustomUserStatusService from './CustomUserStatusService';
import CustomUserStatusTable from './CustomUserStatusTable';

const CustomUserStatusRoute = (): ReactElement => {
	const t = useTranslation();
	const route = useRoute('user-status');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const canManageUserStatus = usePermission('manage-user-status');

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
				<Page.Header title={t('User_Status')}>
					<CustomUserActiveConnections />
					<ButtonGroup>
						<Button onClick={handlePresenceServiceClick}>{t('Presence_service')}</Button>
						<Button onClick={handleNewButtonClick}>{t('New_custom_status')}</Button>
					</ButtonGroup>
				</Page.Header>
				<Page.Content>
					<CustomUserStatusTable reload={reload} onClick={handleItemClick} />
				</Page.Content>
			</Page>
			{context && (
				<VerticalBar bg='light' flexShrink={0}>
					<VerticalBar.Header>
						{context === 'edit' && t('Custom_User_Status_Edit')}
						{context === 'new' && t('Custom_User_Status_Add')}
						{context === 'presence-service' && t('Presence_service_cap')}
						<VerticalBar.Close onClick={handleClose} />
					</VerticalBar.Header>
					{context === 'presence-service' && <CustomUserStatusService />}
					{(context === 'new' || context === 'edit') && (
						<CustomUserStatusFormWithData _id={id} onClose={handleClose} onReload={handleReload} />
					)}
				</VerticalBar>
			)}
		</Page>
	);
};

export default CustomUserStatusRoute;
