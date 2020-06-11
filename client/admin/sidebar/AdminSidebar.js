import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Icon, SearchInput, Scrollable, Skeleton } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState, useMemo, useEffect } from 'react';

import { menu, SideNav, Layout } from '../../../app/ui-utils/client';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoutePath, useCurrentRoute } from '../../contexts/RouterContext';
import { useAtLeastOnePermission } from '../../contexts/AuthorizationContext';
import { sidebarItems } from '../sidebarItems';
import PrivilegedSettingsProvider from '../PrivilegedSettingsProvider';
import { usePrivilegedSettingsGroups } from '../../contexts/PrivilegedSettingsContext';

const SidebarItem = React.memo(({ permissionGranted, pathGroup, href, icon, label, currentPath }) => {
	const params = useMemo(() => ({ group: pathGroup }), [pathGroup]);
	const path = useRoutePath(href, params);
	const isActive = path === currentPath || false;
	if (permissionGranted && !permissionGranted()) { return null; }
	return <Box
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
				&:focus,
				&.active:focus,
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
	</Box>;
});

const SidebarItemsAssembler = React.memo(({ items, currentPath }) => {
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
});

const AdminSidebarPages = ({ currentPath }) => {
	const items = useReactiveValue(() => sidebarItems.get());

	return <Box display='flex' flexDirection='column' flexShrink={0}>
		<SidebarItemsAssembler items={items} currentPath={currentPath}/>
	</Box>;
};

const AdminSidebarSettings = ({ currentPath }) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const handleChange = useCallback((e) => setFilter(e.currentTarget.value), []);

	const groups = usePrivilegedSettingsGroups(useDebouncedValue(filter, 400));
	const isLoadingGroups = false; // TODO: get from PrivilegedSettingsContext

	return <Box is='section' display='flex' flexDirection='column' flexShrink={0}>
		<Box mi='x24' mb='x16' fontScale='p2' color='hint'>{t('Settings')}</Box>
		<Box pi='x24' mb='x8' display='flex'>
			<SearchInput
				value={filter}
				placeholder={t('Search')}
				onChange={handleChange}
				addon={<Icon name='magnifier' size='x20'/>}
				className={['asdsads']}
			/>
		</Box>
		<Box display='flex' flexDirection='column'>
			{isLoadingGroups && <Skeleton/>}
			{!isLoadingGroups && !!groups.length && <SidebarItemsAssembler
				items={groups.map((group) => ({
					name: t(group.i18nLabel || group._id),
					href: 'admin',
					pathGroup: group._id,
				}))}
				currentPath={currentPath}
			/>}
			{!isLoadingGroups && !groups.length && <Box pi='x28' mb='x4' color='hint'>{t('Nothing_found')}</Box>}
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

	useEffect(() => {
		if (!currentPath.startsWith('/admin/')) {
			SideNav.closeFlex();
		}
	}, [currentRoute]);

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
