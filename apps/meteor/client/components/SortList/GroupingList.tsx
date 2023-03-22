import { CheckBox, OptionTitle } from '@rocket.chat/fuselage';
import { useUserPreference, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import ListItem from '../Sidebar/ListItem';

const GroupingList = function GroupingList(): ReactElement {
	const t = useTranslation();

	const sidebarGroupByType = useUserPreference<boolean>('sidebarGroupByType');
	const sidebarShowFavorites = useUserPreference<boolean>('sidebarShowFavorites');
	const sidebarShowUnread = useUserPreference<boolean>('sidebarShowUnread');

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const useHandleChange = (key: 'sidebarGroupByType' | 'sidebarShowFavorites' | 'sidebarShowUnread', value: boolean): (() => void) =>
		useCallback(() => saveUserPreferences({ data: { [key]: value } }), [key, value]);

	const handleChangeGroupByType = useHandleChange('sidebarGroupByType', !sidebarGroupByType);
	const handleChangeShoFavorite = useHandleChange('sidebarShowFavorites', !sidebarShowFavorites);
	const handleChangeShowUnread = useHandleChange('sidebarShowUnread', !sidebarShowUnread);

	return (
		<>
			<OptionTitle>{t('Group_by')}</OptionTitle>
			<ul>
				<ListItem
					is='label'
					role='listitem'
					icon='flag'
					text={t('Unread')}
					input={<CheckBox pis='x24' onChange={handleChangeShowUnread} checked={sidebarShowUnread} />}
				/>
				<ListItem
					is='label'
					role='listitem'
					icon='star'
					text={t('Favorites')}
					input={<CheckBox pis='x24' onChange={handleChangeShoFavorite} checked={sidebarShowFavorites} />}
				/>
				<ListItem
					is='label'
					role='listitem'
					icon='group-by-type'
					text={t('Types')}
					input={<CheckBox pis='x24' onChange={handleChangeGroupByType} checked={sidebarGroupByType} />}
				/>
			</ul>
		</>
	);
};

export default GroupingList;
