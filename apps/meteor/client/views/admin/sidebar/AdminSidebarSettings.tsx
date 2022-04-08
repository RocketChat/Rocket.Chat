import { Box, Icon, SearchInput, Skeleton } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import React, { useCallback, useState, useMemo, FC } from 'react';

import { ISetting } from '../../../../definition/ISetting';
import Sidebar from '../../../components/Sidebar';
import { useSettings } from '../../../contexts/SettingsContext';
import { TranslationKey, useTranslation } from '../../../contexts/TranslationContext';

const useSettingsGroups = (filter: string): ISetting[] => {
	const settings = useSettings();

	const t = useTranslation();

	const filterPredicate = useMemo(() => {
		if (!filter) {
			return (): boolean => true;
		}

		const getMatchableStrings = (setting: ISetting): string[] =>
			[setting.i18nLabel && t(setting.i18nLabel as TranslationKey), t(setting._id as TranslationKey), setting._id].filter(Boolean);

		try {
			const filterRegex = new RegExp(filter, 'i');
			return (setting: ISetting): boolean => getMatchableStrings(setting).some((text) => filterRegex.test(text));
		} catch (e) {
			return (setting: ISetting): boolean => getMatchableStrings(setting).some((text) => text.slice(0, filter.length) === filter);
		}
	}, [filter, t]);

	return useMemo(() => {
		const groupIds = Array.from(
			new Set(
				settings.filter(filterPredicate).map((setting) => {
					if (setting.type === 'group') {
						return setting._id;
					}

					return setting.group;
				}),
			),
		);

		return settings
			.filter(({ type, group, _id }) => type === 'group' && groupIds.includes(group || _id))
			.sort((a, b) => t((a.i18nLabel || a._id) as TranslationKey).localeCompare(t((b.i18nLabel || b._id) as TranslationKey)));
	}, [settings, filterPredicate, t]);
};

type AdminSidebarSettingsProps = {
	currentPath: string;
};

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
