import { Box, Margins, CheckBox } from '@rocket.chat/fuselage';
import React, { useCallback } from 'react';

import { useMethod } from '../../contexts/ServerContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useUserPreference } from '../../contexts/UserContext';
import SortListItem from './SortListItem';

const style = {
	textTransform: 'uppercase',
};

function GroupingList() {
	const isDiscussionEnabled = useSetting('Discussion_enabled');
	const sidebarShowDiscussion = useUserPreference('sidebarShowDiscussion');
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const sidebarShowFavorites = useUserPreference('sidebarShowFavorites');
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');

	const saveUserPreferences = useMethod('saveUserPreferences');

	const useHandleChange = (key, value) =>
		useCallback(() => saveUserPreferences({ [key]: value }), [key, value]);

	const handleChangeShowDicussion = useHandleChange(
		'sidebarShowDiscussion',
		!sidebarShowDiscussion,
	);
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
					{isDiscussionEnabled && (
						<SortListItem
							icon={'discussion'}
							text={t('Discussions')}
							input={
								<CheckBox
									onChange={handleChangeShowDicussion}
									name='sidebarShowDiscussion'
									checked={sidebarShowDiscussion}
								/>
							}
						/>
					)}
					<SortListItem
						icon={'group-by-type'}
						text={t('Type')}
						input={
							<CheckBox
								onChange={handleChangeGroupByType}
								name='sidebarGroupByType'
								checked={sidebarGroupByType}
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
						icon={'eye-off'}
						text={t('Unread_on_top')}
						input={
							<CheckBox
								onChange={handleChangeShowUnread}
								name='sidebarShowUnread'
								checked={sidebarShowUnread}
							/>
						}
					/>
				</Margins>
			</ul>
		</>
	);
}

export default GroupingList;
