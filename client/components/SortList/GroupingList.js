import { Box, Margins, CheckBox } from '@rocket.chat/fuselage';
import React, { useCallback } from 'react';

import { useMethod } from '../../contexts/ServerContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useUserPreference } from '../../contexts/UserContext';
import SortListItem from './SortListItem';

const style = {
	textTransform: 'uppercase',
};

function GroupingList() {
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const sidebarShowFavorites = useUserPreference('sidebarShowFavorites');
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');

	const saveUserPreferences = useMethod('saveUserPreferences');

	const useHandleChange = (key, value) =>
		useCallback(() => saveUserPreferences({ [key]: value }), [key, value]);

	const handleChangeGroupByType = useHandleChange('sidebarGroupByType', !sidebarGroupByType);
	const handleChangeShoFavorite = useHandleChange('sidebarShowFavorites', !sidebarShowFavorites);
	const handleChangeShowUnread = useHandleChange('sidebarShowUnread', !sidebarShowUnread);

	const t = useTranslation();
	return (
		<>
			<Margins block='x8'>
				<Box is='p' style={style} fontScale='micro'>
					{t('Group_by')}
				</Box>
			</Margins>
			<ul className='rc-popover__list'>
				<Margins block='x8'>
					<SortListItem
						icon={'flag'}
						text={t('Unread')}
						input={
							<CheckBox
								onChange={handleChangeShowUnread}
								name='sidebarShowUnread'
								checked={sidebarShowUnread}
							/>
						}
					/>
					<SortListItem
						icon={'star'}
						text={t('Favorites')}
						input={
							<CheckBox
								onChange={handleChangeShoFavorite}
								name='sidebarShowFavorites'
								checked={sidebarShowFavorites}
							/>
						}
					/>
					<SortListItem
						icon={'group-by-type'}
						text={t('Types')}
						input={
							<CheckBox
								onChange={handleChangeGroupByType}
								name='sidebarGroupByType'
								checked={sidebarGroupByType}
							/>
						}
					/>
				</Margins>
			</ul>
		</>
	);
}

export default GroupingList;
