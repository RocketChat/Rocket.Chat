import { Button, CheckBox, OptionContent, Option, OptionTitle, ToggleSwitch, Box } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useUserPreference, useMethod, useTranslation, useLayout, useRoute } from '@rocket.chat/ui-contexts';
import React, { useCallback, ReactElement } from 'react';

import ListItem from '../Sidebar/ListItem';

const GroupingList = function GroupingList(): ReactElement {
	const t = useTranslation();

	const directoryRoute = useRoute('directory');
	const { sidebar } = useLayout();
	const handleDirectory = useMutableCallback(() => {
		sidebar.toggle();
		directoryRoute.push({ tab: 'categories' });
	});

	const sidebarGroupByType = useUserPreference<boolean>('sidebarGroupByType');
	const sidebarShowFavorites = useUserPreference<boolean>('sidebarShowFavorites');
	const sidebarShowUnread = useUserPreference<boolean>('sidebarShowUnread');

	const saveUserPreferences = useMethod('saveUserPreferences');

	const useHandleChange = (key: 'sidebarGroupByType' | 'sidebarShowFavorites' | 'sidebarShowUnread', value: boolean): (() => void) =>
		useCallback(() => saveUserPreferences({ [key]: value }), [key, value]);

	const handleChangeGroupByType = useHandleChange('sidebarGroupByType', !sidebarGroupByType);
	const handleChangeShoFavorite = useHandleChange('sidebarShowFavorites', !sidebarShowFavorites);
	const handleChangeShowUnread = useHandleChange('sidebarShowUnread', !sidebarShowUnread);

	return (
		<>
			<OptionTitle>{t('Group_by')}</OptionTitle>
			<ul>
				<ListItem
					icon='extended-view'
					text='Category'
					input={<ToggleSwitch pis='x24' onChange={handleChangeGroupByType} name='sidebarDisplayAvatar' checked={sidebarGroupByType} />}
				/>
				{!sidebarGroupByType && (
					<>
						<ListItem
							icon={'flag'}
							text={t('Unread')}
							input={<CheckBox pis='x24' onChange={handleChangeShowUnread} name='sidebarShowUnread' checked={sidebarShowUnread} />}
						/>
						<ListItem
							icon={'star'}
							text={t('Favorites')}
							input={<CheckBox pis='x24' onChange={handleChangeShoFavorite} name='sidebarShowFavorites' checked={sidebarShowFavorites} />}
						/>
						<ListItem
							icon={'group-by-type'}
							text={t('Types')}
							input={<CheckBox pis='x24' onChange={handleChangeGroupByType} name='sidebarGroupByType' checked={sidebarGroupByType} />}
						/>
					</>
				)}
				{sidebarGroupByType && (
					<Option onClick={handleDirectory}>
						<OptionContent>
							<Box display='flex' justifyContent='center' pb='x4'>
								<Button secondary onClick={handleDirectory}>
									Set Categories
								</Button>
							</Box>
						</OptionContent>
					</Option>
				)}
			</ul>
		</>
	);
};

export default GroupingList;
