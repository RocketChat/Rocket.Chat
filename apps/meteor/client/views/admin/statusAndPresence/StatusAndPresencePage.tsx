import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import {
	ContextualbarHeader,
	ContextualbarClose,
	ContextualbarTitle,
	ContextualbarDialog,
	Page,
	PageHeader,
	PageContent,
} from '@rocket.chat/ui-client';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import SettingsTab from './SettingsTab';
import StatusAndPresenceTabs from './StatusAndPresenceTabs';
import type { StatusAndPresenceTab } from './StatusAndPresenceTabs';
import UserPresenceEditorFormWithData from './UserPresenceEditorFormWithData';
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
	settingIds: string[];
};

const StatusAndPresencePage = ({ tab, canManageCustomStatus, canManageUserPresence, settingIds }: StatusAndPresencePageProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const { data: license } = useIsEnterprise();

	const navigate = useStableCallback((params: { tab: StatusAndPresenceTab; context?: string; id?: string }) =>
		router.navigate({ name: 'user-status', params }),
	);

	const handleTabChange = useStableCallback((next: StatusAndPresenceTab) => navigate({ tab: next }));

	const handleItemClick = useStableCallback((id: string) => navigate({ tab, context: 'edit', id }));

	const handleNewButtonClick = useStableCallback(() => navigate({ tab, context: 'new' }));

	const handlePresenceServiceClick = useStableCallback(() => navigate({ tab, context: 'presence-service' }));

	const handleClose = useStableCallback(() => navigate({ tab }));

	const handleEdit = useStableCallback((user?: ManagedPresenceUser) =>
		navigate(user?.username ? { tab, context: 'edit', id: user.username } : { tab, context: 'new' }),
	);

	const reload = useRef(() => null);

	const handleReload = useStableCallback(() => reload.current());

	const tabs = (
		<StatusAndPresenceTabs
			currentTab={tab}
			onChange={handleTabChange}
			canManageCustomStatus={canManageCustomStatus}
			canManageUserPresence={canManageUserPresence}
			canViewSettings={settingIds.length > 0}
		/>
	);

	const headerButtons = canManageCustomStatus ? <Button onClick={handlePresenceServiceClick}>{t('Presence_service')}</Button> : undefined;

	const contextualBar: { title: string; content: ReactElement } | undefined =
		(canManageCustomStatus &&
			context === 'presence-service' && { title: t('Presence_service_cap'), content: <CustomUserStatusService /> }) ||
		(canManageCustomStatus &&
			tab === 'custom-status' &&
			(context === 'new' || context === 'edit') && {
				title: t(context === 'new' ? 'Custom_User_Status_Add' : 'Custom_User_Status_Edit'),
				content: <CustomUserStatusFormWithData _id={id} onClose={handleClose} onReload={handleReload} />,
			}) ||
		(canManageUserPresence &&
			tab === 'user-presence' &&
			(context === 'new' || context === 'edit') && {
				title: t('Manage_user_status'),
				content: <UserPresenceEditorFormWithData username={id} onClose={handleClose} />,
			}) ||
		undefined;

	return (
		<Page flexDirection='row'>
			<Page name='admin-user-status'>
				{tab === 'settings' ? (
					<SettingsTab settingIds={settingIds} tabs={tabs} headerButtons={headerButtons} />
				) : (
					<>
						<PageHeader title={t('Status_and_presence')}>
							{canManageCustomStatus && license?.isEnterprise === false && <CustomUserActiveConnections />}
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
