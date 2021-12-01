import { Box, Margins, Divider, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { ReactElement } from 'react';

import { callbacks } from '../../../app/callbacks/lib/callbacks';
import { popover, AccountBox, SideNav } from '../../../app/ui-utils/client';
import { userStatus } from '../../../app/user-status/client';
import { IUser } from '../../../definition/IUser';
import { UserStatus as UserStatusEnum } from '../../../definition/UserStatus';
import MarkdownText from '../../components/MarkdownText';
import { UserStatus } from '../../components/UserStatus';
import UserAvatar from '../../components/avatar/UserAvatar';
import { useAtLeastOnePermission } from '../../contexts/AuthorizationContext';
import { useLayout } from '../../contexts/LayoutContext';
import { useRoute } from '../../contexts/RouterContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useLogout } from '../../contexts/UserContext';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useUserDisplayName } from '../../hooks/useUserDisplayName';
import { imperativeModal } from '../../lib/imperativeModal';
import EditStatusModal from './EditStatusModal';

const ADMIN_PERMISSIONS = [
	'view-logs',
	'manage-emoji',
	'manage-sounds',
	'view-statistics',
	'manage-oauth-apps',
	'view-privileged-setting',
	'manage-selected-settings',
	'view-room-administration',
	'view-user-administration',
	'access-setting-permissions',
	'manage-outgoing-integrations',
	'manage-incoming-integrations',
	'manage-own-outgoing-integrations',
	'manage-own-incoming-integrations',
	'view-engagement-dashboard',
];

const setStatus = (status: IUser['status']): void => {
	AccountBox.setStatus(status);
	callbacks.run('userStatusManuallySet', status);
};

const getItems = (): ReturnType<typeof AccountBox.getItems> => AccountBox.getItems();

const translateStatusName = (t: ReturnType<typeof useTranslation>, name: string): string => {
	const isDefaultStatus = (name: string): name is UserStatusEnum => name in UserStatusEnum;
	if (isDefaultStatus(name)) {
		return t(name);
	}

	return name;
};

type UserDropdownProps = {
	user: IUser;
	onClose: () => void;
};

const UserDropdown = ({ user, onClose }: UserDropdownProps): ReactElement => {
	const t = useTranslation();
	const accountRoute = useRoute('account');
	const adminRoute = useRoute('admin');
	const logout = useLogout();
	const { sidebar } = useLayout();

	const { username, avatarETag, status, statusText } = user;

	const displayName = useUserDisplayName(user);

	const filterInvisibleStatus = !useSetting('Accounts_AllowInvisibleStatusOption')
		? (key: keyof typeof userStatus['list']): boolean => userStatus.list[key].name !== 'invisible'
		: (): boolean => true;

	const showAdmin = useAtLeastOnePermission(ADMIN_PERMISSIONS);

	const handleCustomStatus = useMutableCallback((e) => {
		e.preventDefault();
		imperativeModal.open({
			component: EditStatusModal,
			props: { userStatus: status, userStatusText: statusText, onClose: imperativeModal.close },
		});
		onClose();
	});

	const handleMyAccount = useMutableCallback(() => {
		accountRoute.push({});
		popover.close();
	});

	const handleAdmin = useMutableCallback(() => {
		adminRoute.push({ group: 'info' });
		sidebar.toggle();
		popover.close();
	});

	const handleLogout = useMutableCallback(() => {
		logout();
		popover.close();
	});

	const accountBoxItems = useReactiveValue(getItems);

	return (
		<Box display='flex' flexDirection='column' maxWidth='244px'>
			<Box display='flex' flexDirection='row' mi='neg-x8'>
				<Box mie='x4' mis='x8'>
					<UserAvatar size='x36' username={username || ''} etag={avatarETag} />
				</Box>
				<Box
					mie='x8'
					mis='x4'
					display='flex'
					overflow='hidden'
					flexDirection='column'
					fontScale='p3'
					mb='neg-x4'
					flexGrow={1}
					flexShrink={1}
				>
					<Box withTruncatedText w='full' display='flex' alignItems='center' flexDirection='row'>
						<Margins inline='x4'>
							<UserStatus status={status} />
							<Box is='span' withTruncatedText display='inline-block'>
								{displayName}
							</Box>
						</Margins>
					</Box>
					<Box color='hint'>
						<MarkdownText
							withTruncatedText
							content={statusText || t(status || 'offline')}
							variant='inlineWithoutBreaks'
						/>
					</Box>
				</Box>
			</Box>
			<Divider mi='neg-x16' mb='x16' borderColor='muted' />
			<Box mi='neg-x16'>
				<Box pi='x16' fontScale='c1' textTransform='uppercase'>
					{t('Status')}
				</Box>
				{Object.keys(userStatus.list)
					.filter(filterInvisibleStatus)
					.map((key, i) => {
						const status = userStatus.list[key];
						const name = status.localizeName ? translateStatusName(t, status.name) : status.name;
						const modifier = status.statusType || user.status;

						return (
							<Option
								key={i}
								onClick={(): void => {
									setStatus(status.statusType);
									onClose();
								}}
							>
								<Option.Column>
									<UserStatus status={modifier} />
								</Option.Column>
								<Option.Content>{name}</Option.Content>
							</Option>
						);
					})}
				<Option
					icon='emoji'
					label={`${t('Custom_Status')}...`}
					onClick={handleCustomStatus}
				></Option>
			</Box>

			{(accountBoxItems.length || showAdmin) && (
				<>
					<Divider mi='neg-x16' mb='x16' />
					<Box mi='neg-x16'>
						{showAdmin && (
							<Option icon={'customize'} label={t('Administration')} onClick={handleAdmin}></Option>
						)}
						{accountBoxItems.map((item, i) => {
							let action;

							if (item.href || item.sideNav) {
								action = (): void => {
									if (item.href) {
										FlowRouter.go(item.href);
										popover.close();
									}
									if (item.sideNav) {
										SideNav.setFlex(item.sideNav);
										SideNav.openFlex();
										popover.close();
									}
								};
							}

							return (
								<Option icon={item.icon} label={t(item.name)} onClick={action} key={i}></Option>
							);
						})}
					</Box>
				</>
			)}

			<Divider mi='neg-x16' mb='x16' />
			<Box mi='neg-x16'>
				<Option icon='user' label={t('My_Account')} onClick={handleMyAccount}></Option>
				<Option icon='sign-out' label={t('Logout')} onClick={handleLogout}></Option>
			</Box>
		</Box>
	);
};

export default UserDropdown;
