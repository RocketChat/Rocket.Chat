import React from 'react';
import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { popover, AccountBox, SideNav } from '../../../../app/ui-utils';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { useAtLeastOnePermission } from '../../../contexts/AuthorizationContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const ADMIN_PERMISSIONS = ['manage-emoji', 'manage-oauth-apps', 'manage-outgoing-integrations', 'manage-incoming-integrations', 'manage-own-outgoing-integrations', 'manage-own-incoming-integrations', 'manage-selected-settings', 'manage-sounds', 'view-logs', 'view-privileged-setting', 'view-room-administration', 'view-statistics', 'view-user-administration', 'access-setting-permissions'];

const openPopover = (e, accountBoxItems, t, adminOption) => popover.open({
	popoverClass: 'sidebar-header',
	columns: [
		{
			groups: [
				{
					items: accountBoxItems.map((item) => {
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

						return {
							icon: item.icon,
							name: t(item.name),
							type: 'open',
							id: item.name,
							href: item.href,
							sideNav: item.sideNav,
							action,
						};
					}).concat([adminOption]),
				},
			],
		},
	],
	currentTarget: e.currentTarget,
	offsetVertical: e.currentTarget.clientHeight + 10,
});

const getItems = () => AccountBox.getItems();

const adminOption = (showAdmin, t) => (showAdmin ? {
	icon: 'customize',
	name: t('Administration'),
	type: 'open',
	id: 'administration',
	action: () => {
		FlowRouter.go('admin', { group: 'info' });
		popover.close();
	},
} : undefined);

const Menu = (props) => {
	const t = useTranslation();
	const showAdmin = useAtLeastOnePermission(ADMIN_PERMISSIONS);

	const accountBoxItems = useReactiveValue(getItems);

	const onClick = useMutableCallback((e) => openPopover(e, accountBoxItems, t, adminOption(showAdmin, t)));

	const showMenu = accountBoxItems?.length > 0;

	return showAdmin || showMenu ? <Sidebar.TopBar.Action {...props} icon='menu' onClick={onClick}/> : null;
};

export default Menu;
