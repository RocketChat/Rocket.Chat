import React, { useCallback, useState } from 'react';
import { Box, Button, Icon, SearchInput, Scrollable } from '@rocket.chat/fuselage';

import { menu, SideNav, Layout } from '../../../app/ui-utils/client';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import { sidebarItems } from '../sidebarItems';
import { useSettingsGroupsFiltered } from './useSettingsCollectionPrivate';

const SidebarItems = ({ items }) => {
	const t = useTranslation();
	return <Box is='ul' display='flex' flexDirection='column'>
		{items.map(({ href, i18nLabel: label, icon, permissionGranted }) => {
			if (permissionGranted && !permissionGranted()) { return null; }
			const router = useRoute(href);
			const handleClick = useCallback(() => router.push({}), []);
			return <Box is='li' pb='x8' pi='x24' key={href} href={href} onClick={handleClick} display='flex' flexDirection='row' alignItems='center'>
				{icon && <Icon name={icon} size='x16' mi='x2'/>}
				<Box withTruncatedText fontScale='p1' mi='x4'>{t(label)}</Box>
			</Box>;
		})}
	</Box>;
};

const SidebarSettings = ({ groups, filter, setFilter }) => {
	const t = useTranslation();
	const handleChange = useCallback((e) => setFilter(e.currentTarget.value), []);
	return <Box is='section' display='flex' flexDirection='column'>
		<Box mi='x24' mb='x16' fontScale='p2' color='hint'>{t('Settings')}</Box>
		<Box pi='x24' mb='x8' display='flex'>
			<Box is={SearchInput} border='0' value={filter} onChange={handleChange} addon={<Icon name='magnifier' size='x20'/>}/>
		</Box>
		<Box is='ul' display='flex' flexDirection='column'>
			{groups.map(({ pathSection, pathGroup, name, permissionGranted }) => {
				if (permissionGranted && !permissionGranted()) { return null; }
				return <Box is='a' pb='x8' pi='x24' key={name} href={`/${ pathSection }/${ pathGroup }`} color='default' display='flex' flexDirection='row' alignItems='center'>
					<Box withTruncatedText fontScale='p1' mi='x4'>{name}</Box>
				</Box>;
			})}
		</Box>
	</Box>;
};

export default function AdminSidebar() {
	const t = useTranslation();
	const sidebarItemsArray = useReactiveValue(() => sidebarItems.get());
	const [filter, setFilter] = useState();

	const settingsGroups = useSettingsGroupsFiltered(filter);

	const closeAdminFlex = useCallback(() => {
		if (Layout.isEmbedded()) {
			menu.close();
			return;
		}

		SideNav.closeFlex();
	}, []);

	return <Box display='flex' flexDirection='column' h='full' flexGrow={1} flexShrink={1}>
		<Box is='header' padding='x24' display='flex' flexDirection='row' justifyContent='space-between'>
			<Box fontScale='s1'>{t('Administration')}</Box>
			<Button square small onClick={closeAdminFlex}><Icon name='cross' size='x16'/></Button>
		</Box>
		<Scrollable>
			<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1}>
				<SidebarItems items={sidebarItemsArray}/>
				<SidebarSettings groups={settingsGroups} filter={filter} setFilter={setFilter}/>
			</Box>
		</Scrollable>
	</Box>;
}
