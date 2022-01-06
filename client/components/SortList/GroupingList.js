import { CheckBox, OptionTitle } from '@rocket.chat/fuselage';
import React, { useCallback } from 'react';

import { useMethod } from '../../contexts/ServerContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useUserPreference } from '../../contexts/UserContext';
import ListItem from '../Sidebar/ListItem';

const style = {
	textTransform: 'uppercase',
};

const checkBoxStyle = {
	paddingLeft: '24px',
	paddingInlineStart: '24px',
};

function GroupingList() {
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const sidebarShowFavorites = useUserPreference('sidebarShowFavorites');
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');

	const saveUserPreferences = useMethod('saveUserPreferences');

	const useHandleChange = (key, value) => useCallback(() => saveUserPreferences({ [key]: value }), [key, value]);

	const handleChangeGroupByType = useHandleChange('sidebarGroupByType', !sidebarGroupByType);
	const handleChangeShoFavorite = useHandleChange('sidebarShowFavorites', !sidebarShowFavorites);
	const handleChangeShowUnread = useHandleChange('sidebarShowUnread', !sidebarShowUnread);

	const t = useTranslation();

	return (
		<>
			<OptionTitle style={style}>{t('Group_by')}</OptionTitle>
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
}

export default GroupingList;
