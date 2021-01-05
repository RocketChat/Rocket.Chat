import React from 'react';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { Box, Icon, Margins, Divider } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { css } from '@rocket.chat/css-in-js';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';

import UserAvatar from '../../components/avatar/UserAvatar';
import { UserStatus } from '../../components/UserStatus';
import { useSetting } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useAtLeastOnePermission } from '../../contexts/AuthorizationContext';
import { userStatus } from '../../../app/user-status';
import { callbacks } from '../../../app/callbacks';
import { popover, AccountBox, modal, SideNav } from '../../../app/ui-utils';

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

const Item = ({ icon, label, onClick }) => {
	const clickable = css`
		cursor: pointer;
		&:hover,
		&:focus {
			background: ${ colors.n100 };
		}
	`;

	return <Box mi='neg-x16' pi='x16' className={clickable}>
		<Box display='flex' flexDirection='row' onClick={onClick} alignItems='center' mi='neg-x4' pb='x4'>
			<Margins inline='x4'>
				<Box>{typeof icon === 'string' ? <Icon size='x16' name={icon} mi='neg-x2'/> : icon}</Box>
				<Box withTruncatedText fontScale='p2'>{label}</Box>
			</Margins>
		</Box>
	</Box>;
};

const setStatus = (status, statusText) => {
	AccountBox.setStatus(status, statusText);
	callbacks.run('userStatusManuallySet', status);
};

const getItems = () => AccountBox.getItems();

const UserDropdown = ({ user, onClose }) => {
	const t = useTranslation();
	const homeRoute = useRoute('home');
	const accountRoute = useRoute('account');
	const adminRoute = useRoute('admin');

	const {
		name,
		username,
		avatarETag,
		status,
		statusText,
	} = user;

	const useRealName = useSetting('UI_Use_Real_Name');
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

	const handleLogout = useMutableCallback(() => {
		Meteor.logout(() => {
			callbacks.run('afterLogoutCleanUp', user);
			Meteor.call('logoutCleanUp', user);
			homeRoute.push({});
			popover.close();
		});
	});

	const handleMyAccount = useMutableCallback(() => {
		accountRoute.push({});
		popover.close();
	});

	const handleAdmin = useMutableCallback(() => {
		adminRoute.push({ group: 'info' });
		popover.close();
	});

	const accountBoxItems = useReactiveValue(getItems);

	return <Box display='flex' flexDirection='column'>

		<Box display='flex' flexDirection='row' mi='neg-x8' >
			<Box mie='x4' mis='x8'><UserAvatar size='x36' username={username} etag={avatarETag} /></Box>
			<Box mie='x8' mis='x4' display='flex' flexDirection='column' fontScale='p1' mb='neg-x4' flexGrow={1} flexShrink={1}>
				<Box withTruncatedText w='full' display='flex' alignItems='center' flexDirection='row'>
					<Margins inline='x4'>
						<UserStatus status={status}/>
						<Box is='span' withTruncatedText display='inline-block'>{useRealName ? name || username : username}</Box>
					</Margins>
				</Box>
				<Box color='hint' withTruncatedText display='inline-block'>
					{statusText || t(status)}
				</Box>
			</Box>
		</Box>

		<Divider mi='neg-x16' mb='x16' borderColor='muted'/>
		<div>
			<Box fontScale='c1' textTransform='uppercase'>{t('Status')}</Box>
			{Object.keys(userStatus.list).map((key) => {
				const status = userStatus.list[key];
				const name = status.localizeName ? t(status.name) : status.name;
				const modifier = status.statusType || user.status;

				return <Item
					key={key}
					icon={<UserStatus status={modifier}/>}
					label={name}
					onClick={() => { setStatus(status.statusType, name); onClose(); }}
				/>;
			})}
			<Item icon='emoji' label={`${ t('Custom_Status') }...`} onClick={handleCustomStatus}/>
		</div>

		{(accountBoxItems.length || showAdmin) && <>
			<Divider mi='neg-x16' mb='x16'/>
			<div>
				{showAdmin && <Item icon={'customize'} label={t('Administration')} onClick={handleAdmin}/>}
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

					return <Item icon={item.icon} label={t(item.name)} onClick={action} key={i}/>;
				})}
			</div>
		</>}

		<Divider mi='neg-x16' mb='x16'/>
		<div>
			<Item icon='user' label={t('My_Account')} onClick={handleMyAccount}/>
			<Item icon='sign-out' label={t('Logout')} onClick={handleLogout}/>
		</div>

	</Box>;
};

export default UserDropdown;
