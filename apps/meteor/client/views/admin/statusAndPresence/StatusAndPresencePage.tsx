import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import {
	ContextualbarHeader,
	ContextualbarClose,
	ContextualbarTitle,
	ContextualbarDialog,
	Page,
	PageHeader,
	PageContent,
} from '@rocket.chat/ui-client';
import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo, useCallback, useRef, useState } from 'react';

import SettingsTab from './SettingsTab';
import StatusAndPresenceTabs from './StatusAndPresenceTabs';
import type { StatusAndPresenceTab } from './StatusAndPresenceTabs';
import UserPresenceEditorForm from './UserPresenceEditorForm';
import UserPresenceTab from './UserPresenceTab';
import type { ManagedPresenceUser } from './useManagedPresenceUsers';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import CustomUserActiveConnections from '../customUserStatus/CustomUserActiveConnections';
import CustomUserStatusFormWithData from '../customUserStatus/CustomUserStatusFormWithData';
import CustomUserStatusService from '../customUserStatus/CustomUserStatusService';
import CustomUserStatusTable from '../customUserStatus/CustomUserStatusTable';

export type StatusAndPresencePageProps = {
	tab: StatusAndPresenceTab;
	canManageCustomStatus: boolean;
	canManageUserPresence: boolean;
	canViewSettings: boolean;
};

const StatusAndPresencePage = ({ tab, canManageCustomStatus, canManageUserPresence, canViewSettings }: StatusAndPresencePageProps) => {
	const t = useTranslation();
	const route = useRoute('user-status');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const { data: license } = useIsEnterprise();

	const [editing, setEditing] = useState<{ user?: ManagedPresenceUser }>();

	const handleTabChange = useCallback((next: StatusAndPresenceTab) => route.push({ tab: next }), [route]);

	const handleItemClick = useCallback((id: string) => route.push({ tab, context: 'edit', id }), [route, tab]);

	const handleNewButtonClick = useCallback(() => route.push({ tab, context: 'new' }), [route, tab]);

	const handlePresenceServiceClick = useCallback(() => route.push({ tab, context: 'presence-service' }), [route, tab]);

	const handleClose = useCallback(() => {
		setEditing(undefined);
		route.push({ tab });
	}, [route, tab]);

	const handleEdit = useCallback((user?: ManagedPresenceUser) => setEditing({ user }), []);

	const reload = useRef(() => null);

	const handleReload = useCallback(() => reload.current(), [reload]);

	const tabs = (
		<StatusAndPresenceTabs
			currentTab={tab}
			onChange={handleTabChange}
			canManageCustomStatus={canManageCustomStatus}
			canManageUserPresence={canManageUserPresence}
			canViewSettings={canViewSettings}
		/>
	);

	const headerButtons = <Button onClick={handlePresenceServiceClick}>{t('Presence_service')}</Button>;

	const contextualBar: { title: string; content: ReactElement } | undefined =
		(context === 'presence-service' && { title: t('Presence_service_cap'), content: <CustomUserStatusService /> }) ||
		(canManageCustomStatus &&
			(context === 'new' || context === 'edit') && {
				title: t(context === 'new' ? 'Custom_User_Status_Add' : 'Custom_User_Status_Edit'),
				content: <CustomUserStatusFormWithData _id={id} onClose={handleClose} onReload={handleReload} />,
			}) ||
		(canManageUserPresence &&
			editing && {
				title: t('Manage_user_presence'),
				content: <UserPresenceEditorForm user={editing.user} onClose={handleClose} />,
			}) ||
		undefined;

	return (
		<Page flexDirection='row'>
			<Page name='admin-user-status'>
				{tab === 'settings' ? (
					<SettingsTab tabs={tabs} headerButtons={headerButtons} />
				) : (
					<>
						<PageHeader title={t('Status_and_presence')}>
							{canManageCustomStatus && !license?.isEnterprise && <CustomUserActiveConnections />}
							<ButtonGroup>{headerButtons}</ButtonGroup>
						</PageHeader>
						{tabs}
						<PageContent>
							{tab === 'custom-status' && (
								<CustomUserStatusTable reload={reload} onClick={handleItemClick}>
									<Button onClick={handleNewButtonClick}>{t('New_custom_status')}</Button>
								</CustomUserStatusTable>
							)}
							{tab === 'user-presence' && <UserPresenceTab onEdit={handleEdit} />}
						</PageContent>
					</>
				)}
			</Page>
			{contextualBar && (
				<ContextualbarDialog onClose={handleClose}>
					<ContextualbarHeader>
						<ContextualbarTitle>{contextualBar.title}</ContextualbarTitle>
						<ContextualbarClose onClick={handleClose} />
					</ContextualbarHeader>
					{contextualBar.content}
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default memo(StatusAndPresencePage);
