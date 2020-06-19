import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Icon, SearchInput, Scrollable, Skeleton } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState, useMemo, useEffect } from 'react';

import { menu, SideNav, Layout } from '../../../app/ui-utils/client';
import { SettingType } from '../../../definition/ISetting';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoutePath, useCurrentRoute } from '../../contexts/RouterContext';
import { useAtLeastOnePermission } from '../../contexts/AuthorizationContext';
import SettingsProvider from '../../providers/SettingsProvider';
import { sidebarItems } from '../sidebarItems';

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
		<Box
			mi='neg-x4'
			display='flex'
			flexDirection='row'
			alignItems='center'>
			{icon && <Icon name={icon} size='x20' mi='x4'/>}
			<Box withTruncatedText fontScale='p1' mi='x4' color='info'>{label}</Box>
		</Box>
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

const AdminSidebarPages = React.memo(({ currentPath }) => {
	const items = useReactiveValue(() => sidebarItems.get());

	return <Box display='flex' flexDirection='column' flexShrink={0} pb='x8'>
		<SidebarItemsAssembler items={items} currentPath={currentPath}/>
	</Box>;
});

const useSettingsGroups = (filter) => {
	const settings = useSettings();

	const t = useTranslation();

	const filterPredicate = useMemo(() => {
		if (!filter) {
			return () => true;
		}

		const getMatchableStrings = (setting) => [
			setting.i18nLabel && t(setting.i18nLabel),
			t(setting._id),
			setting._id,
		].filter(Boolean);

		try {
			const filterRegex = new RegExp(filter, 'i');
			return (setting) =>
				getMatchableStrings(setting).some((text) => filterRegex.test(text));
		} catch (e) {
			return (setting) =>
				getMatchableStrings(setting).some((text) => text.slice(0, filter.length) === filter);
		}
	}, [filter, t]);

	return useMemo(() => {
		const groupIds = Array.from(new Set(
			settings
				.filter(filterPredicate)
				.map((setting) => {
					if (setting.type === SettingType.GROUP) {
						return setting._id;
					}

					return setting.group;
				}),
		));

		return settings
			.filter(({ type, group, _id }) => type === SettingType.GROUP && groupIds.includes(group || _id))
			.sort((a, b) => t(a.i18nLabel || a._id).localeCompare(t(b.i18nLabel || b._id)));
	}, [settings, filterPredicate, t]);
};

const AdminSidebarSettings = ({ currentPath }) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const handleChange = useCallback((e) => setFilter(e.currentTarget.value), []);

	const groups = useSettingsGroups(useDebouncedValue(filter, 400));
	const isLoadingGroups = false; // TODO: get from PrivilegedSettingsContext

	return <Box is='section' display='flex' flexDirection='column' flexShrink={0} pb='x24'>
		<Box pi='x24' pb='x8' fontScale='p2' color='info'>{t('Settings')}</Box>
		<Box pi='x24' pb='x8' display='flex'>
			<SearchInput
				value={filter}
				placeholder={t('Search')}
				onChange={handleChange}
				addon={<Icon name='magnifier' size='x20'/>}
				className={['asdsads']}
			/>
		</Box>
		<Box pb='x16' display='flex' flexDirection='column'>
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

export default React.memo(function AdminSidebar() {
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
	}, [currentRoute, currentPath]);

	// TODO: uplift this provider
	return <SettingsProvider privileged>
		<Box display='flex' flexDirection='column' h='100vh'>
			<Box is='header' pb='x16' pi='x24' display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
				<Box color='neutral-800' fontSize='p1' fontWeight='p1' fontWeight='p1' flexShrink={1} withTruncatedText>{t('Administration')}</Box>
				<Button square small ghost onClick={closeAdminFlex}><Icon name='cross' size='x20'/></Button>
			</Box>
			<Scrollable>
				<Box display='flex' flexDirection='column' h='full'>
					<AdminSidebarPages currentPath={currentPath}/>
					{canViewSettings && <AdminSidebarSettings currentPath={currentPath}/>}
				</Box>
			</Scrollable>
		</Box>
	</SettingsProvider>;
});
