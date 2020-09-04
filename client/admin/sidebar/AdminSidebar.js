import { Box, Icon, SearchInput, Skeleton } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { useSubscription } from 'use-subscription';

import { menu, SideNav, Layout } from '../../../app/ui-utils/client';
import { SettingType } from '../../../definition/ISetting';
import { useSettings } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoutePath, useCurrentRoute } from '../../contexts/RouterContext';
import { useAtLeastOnePermission } from '../../contexts/AuthorizationContext';
import Sidebar from '../../components/basic/Sidebar';
import SettingsProvider from '../../providers/SettingsProvider';
import { itemsSubscription } from '../sidebarItems';
import PlanTag from '../../components/basic/PlanTag';

const AdminSidebarPages = React.memo(({ currentPath }) => {
	const items = useSubscription(itemsSubscription);

	return <Box display='flex' flexDirection='column' flexShrink={0} pb='x8'>
		<Sidebar.ItemsAssembler items={items} currentPath={currentPath}/>
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
			/>
		</Box>
		<Box pb='x16' display='flex' flexDirection='column'>
			{isLoadingGroups && <Skeleton/>}
			{!isLoadingGroups && !!groups.length && <Sidebar.ItemsAssembler
				items={groups.map((group) => ({
					name: t(group.i18nLabel || group._id),
					pathSection: 'admin',
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

	const canViewSettings = useAtLeastOnePermission(
		useMemo(() => [
			'view-privileged-setting',
			'edit-privileged-setting',
			'manage-selected-settings',
		], []),
	);

	const closeAdminFlex = useCallback(() => {
		if (Layout.isEmbedded()) {
			menu.close();
			return;
		}

		SideNav.closeFlex();
	}, []);

	const currentRoute = useCurrentRoute();
	const currentPath = useRoutePath(...currentRoute);
	const [,,, currentRouteGroupName] = currentRoute;

	useEffect(() => {
		if (currentRouteGroupName !== 'admin') {
			SideNav.closeFlex();
		}
	}, [currentRouteGroupName]);

	// TODO: uplift this provider
	return <SettingsProvider privileged>
		<Sidebar>
			<Sidebar.Header onClose={closeAdminFlex} title={<>{t('Administration')} <PlanTag/></>}/>
			<Sidebar.Content>
				<AdminSidebarPages currentPath={currentPath}/>
				{canViewSettings && <AdminSidebarSettings currentPath={currentPath}/>}
			</Sidebar.Content>
		</Sidebar>
	</SettingsProvider>;
});
