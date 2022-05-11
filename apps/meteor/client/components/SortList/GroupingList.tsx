import { CheckBox, OptionTitle } from '@rocket.chat/fuselage';
import { useUserPreference, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, ReactElement } from 'react';

import ListItem from '../Sidebar/ListItem';

const style = {
	textTransform: 'uppercase',
};

const checkBoxStyle = {
	paddingLeft: '24px',
	paddingInlineStart: '24px',
};

// TODO: chapter day frontend: fix OptionTitle style type

const GroupingList = function GroupingList(): ReactElement {
	const sidebarGroupByType = useUserPreference<boolean>('sidebarGroupByType');
	const sidebarShowFavorites = useUserPreference<boolean>('sidebarShowFavorites');
	const sidebarShowUnread = useUserPreference<boolean>('sidebarShowUnread');

	const saveUserPreferences = useMethod('saveUserPreferences');

	const useHandleChange = (key: 'sidebarGroupByType' | 'sidebarShowFavorites' | 'sidebarShowUnread', value: boolean): (() => void) =>
		useCallback(() => saveUserPreferences({ [key]: value }), [key, value]);

	const handleChangeGroupByType = useHandleChange('sidebarGroupByType', !sidebarGroupByType);
	const handleChangeShoFavorite = useHandleChange('sidebarShowFavorites', !sidebarShowFavorites);
	const handleChangeShowUnread = useHandleChange('sidebarShowUnread', !sidebarShowUnread);

	const t = useTranslation();

	return (
		<>
			<OptionTitle {...({ style } as any)}>{t('Group_by')}</OptionTitle>
			<ul className='rc-popover__list'>
				<ListItem
					icon={'flag'}
					text={t('Unread')}
					input={<CheckBox style={checkBoxStyle} onChange={handleChangeShowUnread} name='sidebarShowUnread' checked={sidebarShowUnread} />}
				/>
				<ListItem
					icon={'star'}
					text={t('Favorites')}
					input={
						<CheckBox style={checkBoxStyle} onChange={handleChangeShoFavorite} name='sidebarShowFavorites' checked={sidebarShowFavorites} />
					}
				/>
				<ListItem
					icon={'group-by-type'}
					text={t('Types')}
					input={
						<CheckBox style={checkBoxStyle} onChange={handleChangeGroupByType} name='sidebarGroupByType' checked={sidebarGroupByType} />
					}
				/>
			</ul>
		</>
	);
};

export default GroupingList;
