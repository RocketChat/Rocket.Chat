import { Box, Margins, Divider, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { FlowRouter } from 'meteor/kadira:flow-router';
import React from 'react';

import { callbacks } from '../../../app/callbacks/client';
import { popover, AccountBox, modal, SideNav } from '../../../app/ui-utils/client';
import { userStatus } from '../../../app/user-status/client';
import MarkdownText from '../../components/MarkdownText';
import { UserStatus } from '../../components/UserStatus';
import UserAvatar from '../../components/avatar/UserAvatar';
import { useAtLeastOnePermission } from '../../contexts/AuthorizationContext';
import { useRoute } from '../../contexts/RouterContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useLogout } from '../../contexts/UserContext';
import { useReactiveValue } from '../../hooks/useReactiveValue';

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
];

const style = {
	marginLeft: '-16px',
	marginRight: '-16px',
};

const setStatus = (status) => {
	AccountBox.setStatus(status);
	callbacks.run('userStatusManuallySet', status);
};

const getItems = () => AccountBox.getItems();

const UserDropdown = ({ user, onClose }) => {
	const t = useTranslation();
	const accountRoute = useRoute('account');
	const adminRoute = useRoute('admin');

	const logout = useLogout();

	const { name, username, avatarETag, status, statusText } = user;

	const useRealName = useSetting('UI_Use_Real_Name');
	const filterInvisibleStatus = !useSetting('Accounts_AllowInvisibleStatusOption')
		? (key) => userStatus.list[key].name !== 'invisible'
		: () => true;

	const showAdmin = useAtLeastOnePermission(ADMIN_PERMISSIONS);

	const handleCustomStatus = useMutableCallback((e) => {
		e.preventDefault();
		modal.open({
			title: t('Edit_Status'),
			content: 'editStatus',
			data: {
				onSave() {
					modal.close();
				},
			},
			modalClass: 'modal',
			showConfirmButton: false,
			showCancelButton: false,
			confirmOnEnter: false,
		});
		onClose();
	});

	const handleMyAccount = useMutableCallback(() => {
		accountRoute.push({});
		popover.close();
	});

	const handleAdmin = useMutableCallback(() => {
		adminRoute.push({ group: 'info' });
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
					<UserAvatar size='x36' username={username} etag={avatarETag} />
				</Box>
				<Box
					mie='x8'
					mis='x4'
					display='flex'
					overflow='hidden'
					flexDirection='column'
					fontScale='p1'
					mb='neg-x4'
					flexGrow={1}
					flexShrink={1}
				>
					<Box withTruncatedText w='full' display='flex' alignItems='center' flexDirection='row'>
						<Margins inline='x4'>
							<UserStatus status={status} />
							<Box is='span' withTruncatedText display='inline-block'>
								{useRealName ? name || username : username}
							</Box>
						</Margins>
					</Box>
					<Box color='hint' withTruncatedText display='inline-block'>
						<MarkdownText content={statusText || t(status)} variant='inlineWithoutBreaks' />
					</Box>
				</Box>
			</Box>

			<Divider mi='neg-x16' mb='x16' borderColor='muted' />
			<div style={style}>
				<Box pi='x16' fontScale='c1' textTransform='uppercase'>
					{t('Status')}
				</Box>
				{Object.keys(userStatus.list)
					.filter(filterInvisibleStatus)
					.map((key, i) => {
						const status = userStatus.list[key];
						const name = status.localizeName ? t(status.name) : status.name;
						const modifier = status.statusType || user.status;

						return (
							<Option
								onClick={() => {
									setStatus(status.statusType);
									onClose();
								}}
								key={i}
							>
								<Option.Column>
									<UserStatus status={modifier} />
								</Option.Column>
								<Option.Content>{name}</Option.Content>
							</Option>
						);
					})}
				<Option icon='emoji' label={`${t('Custom_Status')}...`} onClick={handleCustomStatus} />
			</div>

			{(accountBoxItems.length || showAdmin) && (
				<>
					<Divider mi='neg-x16' mb='x16' />
					<div style={style}>
						{showAdmin && (
							<Option icon={'customize'} label={t('Administration')} onClick={handleAdmin} />
						)}
						{accountBoxItems.map((item, i) => {
							let action;

							if (item.href || item.sideNav) {
								action = () => {
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

							return <Option icon={item.icon} label={t(item.name)} onClick={action} key={i} />;
						})}
					</div>
				</>
			)}

			<Divider mi='neg-x16' mb='x16' />
			<div style={style}>
				<Option icon='user' label={t('My_Account')} onClick={handleMyAccount} />
				<Option icon='sign-out' label={t('Logout')} onClick={handleLogout} />
			</div>
		</Box>
	);
};

export default UserDropdown;
