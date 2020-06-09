import React, { useCallback, useState, useMemo } from 'react';
import { Box, Button, Icon, SearchInput, Scrollable, Skeleton } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import { menu, SideNav, Layout } from '../../../app/ui-utils/client';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoutePath, useCurrentRoute } from '../../contexts/RouterContext';
import { useAtLeastOnePermission } from '../../contexts/AuthorizationContext';
import { sidebarItems } from '../sidebarItems';
import { usePrivilegedSettingsGroupsFiltered } from './useSettingsGroupsFiltered';
import PrivilegedSettingsProvider from '../PrivilegedSettingsProvider';

const SidebarItem = ({ permissionGranted, pathGroup, href, icon, label, currentPath }) => {
	if (permissionGranted && !permissionGranted()) { return null; }
	const params = useMemo(() => ({ group: pathGroup }), [pathGroup]);
	const path = useRoutePath(href, params);
	const isActive = path === currentPath || false;
	return useMemo(() => <Box
		is='a'
		color='default'
		pb='x8'
		pi='x24'
		key={path}
		href={path}
		display='flex'
		flexDirection='row'
		alignItems='center'
		className={[
			isActive && 'active',
			css`
				&:hover,
				&.active:hover {
					background-color: var(--sidebar-background-light-hover);
				}

				&.active {
					background-color: var(--sidebar-background-light-active);
				}
			`,
		].filter(Boolean)}
	>
		{icon && <Icon name={icon} size='x16' mi='x2'/>}
		<Box withTruncatedText fontScale='p1' mi='x4'>{label}</Box>
	</Box>, [path, label, name, icon, isActive]);
};

const SidebarItemsAssembler = ({ items, currentPath }) => {
	const t = useTranslation();
	return items.map(({
		href,
		i18nLabel,
		name,
		icon,
		permissionGranted,
		pathGroup,
	}) => <SidebarItem
		permissionGranted={permissionGranted}
		pathGroup={pathGroup}
		href={href}
		icon={icon}
		label={t(i18nLabel || name)}
		key={i18nLabel || name}
		currentPath={currentPath}
	/>);
};

const AdminSidebarPages = ({ currentPath }) => {
	const items = useReactiveValue(() => sidebarItems.get());

	return <Box is='ul' display='flex' flexDirection='column' flexShrink={0}>
		{useMemo(() => <SidebarItemsAssembler items={items} currentPath={currentPath}/>, [items, currentPath])}
	</Box>;
};

const AdminSidebarSettings = ({ currentPath }) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const handleChange = useCallback((e) => setFilter(e.currentTarget.value), []);

	const [groups, loading] = usePrivilegedSettingsGroupsFiltered(filter);

	const showGroups = !!groups.length;

	return <Box is='section' display='flex' flexDirection='column' flexShrink={0}>
		<Box mi='x24' mb='x16' fontScale='p2' color='hint'>{t('Settings')}</Box>
		<Box pi='x24' mb='x8' display='flex'>
			<Box is={SearchInput} border='0' value={filter} onChange={handleChange} addon={<Icon name='magnifier' size='x20'/>}/>
		</Box>
		<Box is='ul' display='flex' flexDirection='column'>
			{loading && <Skeleton/>}
			{!loading && showGroups && <SidebarItemsAssembler items={groups} currentPath={currentPath}/>}
			{!loading && !showGroups && <Box pi='x28' mb='x4' color='hint'>{t('Nothing_found')}</Box>}
		</Box>
	</Box>;
};

export default function AdminSidebar() {
	const t = useTranslation();

	const canViewSettings = useAtLeastOnePermission(['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings']);

	const closeAdminFlex = useCallback(() => {
		if (Layout.isEmbedded()) {
			menu.close();
			return;
		}

		SideNav.closeFlex();
	}, []);

	const currentRoute = useCurrentRoute();
	const currentPath = useRoutePath(...currentRoute);

	// TODO: uplift this provider
	return <PrivilegedSettingsProvider>
		<Box display='flex' flexDirection='column' h='100vh'>
			<Box is='header' padding='x24' display='flex' flexDirection='row' justifyContent='space-between'>
				<Box fontScale='s1'>{t('Administration')}</Box>
				<Button square small ghost onClick={closeAdminFlex}>
					<Icon name='cross' size='x16'/>
				</Button>
			</Box>
			<Scrollable>
				<Box display='flex' flexDirection='column' h='full'>
					<AdminSidebarPages currentPath={currentPath}/>
					{canViewSettings && <AdminSidebarSettings currentPath={currentPath}/>}
				</Box>
			</Scrollable>
		</Box>
	</PrivilegedSettingsProvider>;
}
