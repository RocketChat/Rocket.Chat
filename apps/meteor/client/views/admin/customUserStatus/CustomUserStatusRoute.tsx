import { Box, Button, ButtonGroup, ProgressBar } from '@rocket.chat/fuselage';
import { useRoute, useRouteParameter, usePermission, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useRef, useEffect, useState } from 'react';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import CustomUserStatusFormWithData from './CustomUserStatusFormWithData';
import CustomUserStatusService from './CustomUserStatusService';
import CustomUserStatusTable from './CustomUserStatusTable';

const CustomUserStatusRoute = (): ReactElement => {
	const t = useTranslation();
	const route = useRoute('user-status');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const canManageUserStatus = usePermission('manage-user-status');

	const getConnections = useEndpoint('GET', '/v1/presence.getConnections');
	const [connections, setConnections] = useState<{ current: number; max: number }>();
	const percentage = connections ? (connections?.current / connections?.max) * 100 : 0;

	useEffect(() => {
		(async () => setConnections(await getConnections()))();
	}, [getConnections]);

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
					<Box w='x180' h='x40' mi='x8' fontScale='c1' display='flex' flexDirection='column' justifyContent='space-around'>
						<Box display='flex' justifyContent='space-between'>
							<Box color='default'>{t('Active_connections')}</Box>
							<Box color='hint'>
								{connections?.current}/{connections?.max}
							</Box>
						</Box>
						<ProgressBar percentage={percentage} variant={percentage < 80 ? 'success' : 'danger'} />
					</Box>
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
				<VerticalBar flexShrink={0}>
					<VerticalBar.Header>
						{context === 'edit' && t('Custom_User_Status_Edit')}
						{context === 'new' && t('Custom_User_Status_Add')}
						{context === 'presence-service' && t('Presence_service_cap')}
						<VerticalBar.Close onClick={handleClose} />
					</VerticalBar.Header>
					{context === 'presence-service' && <CustomUserStatusService connections={connections} />}
					{(context === 'new' || context === 'edit') && (
						<CustomUserStatusFormWithData _id={id} onClose={handleClose} onReload={handleReload} />
					)}
				</VerticalBar>
			)}
		</Page>
	);
};

export default CustomUserStatusRoute;
