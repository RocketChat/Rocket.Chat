import { Box, Icon, SearchInput, Skeleton } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState, FC } from 'react';

import Sidebar from '../../../components/Sidebar';
import { TranslationKey, useTranslation } from '../../../contexts/TranslationContext';
import { useSettingsGroups } from '../settings/hooks/useSettingsGroups';

type AdminSidebarSettingsProps = {
	currentPath: string;
};

/**
 *
 * @deprecated remove in favor of SettingsPage
 *
 */
const AdminSidebarSettings: FC<AdminSidebarSettingsProps> = ({ currentPath }) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const handleChange = useCallback((e) => setFilter(e.currentTarget.value), []);

	const groups = useSettingsGroups(useDebouncedValue(filter, 400));
	const isLoadingGroups = false; // TODO: get from PrivilegedSettingsContext

	return (
		<Box is='section' display='flex' flexDirection='column' flexShrink={0} pb='x24'>
			<Box pi='x24' pb='x8' fontScale='p2m' color='info'>
				{t('Settings')}
			</Box>
			<Box pi='x24' pb='x8' display='flex'>
				<SearchInput value={filter} placeholder={t('Search')} onChange={handleChange} addon={<Icon name='magnifier' size='x20' />} />
			</Box>
			<Box pb='x16' display='flex' flexDirection='column'>
				{isLoadingGroups && <Skeleton />}
				{!isLoadingGroups && !!groups.length && (
					<Sidebar.ItemsAssembler
						items={groups.map((group) => ({
							name: t((group.i18nLabel || group._id) as TranslationKey),
							pathSection: 'admin',
							pathGroup: group._id,
						}))}
						currentPath={currentPath}
					/>
				)}
				{!isLoadingGroups && !groups.length && (
					<Box pi='x28' mb='x4' color='hint'>
						{t('Nothing_found')}
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default AdminSidebarSettings;
