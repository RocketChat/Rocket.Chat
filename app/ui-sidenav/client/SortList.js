import React, { useCallback } from 'react';
import { Icon, ToggleSwitch, RadioButton, Box, Flex, Margins } from '@rocket.chat/fuselage';


import { useTranslation } from '../../../client/contexts/TranslationContext';
import { useUserPreference } from '../../../client/contexts/UserContext';
import { useMethod } from '../../../client/contexts/ServerContext';

function SortListItem({ text, icon, input }) {
	return <Flex.Container>
		<Box is='li'>
			<Flex.Container>
				<Box is='label' componentClassName='rc-popover__label' style={{ width: '100%' }}>
					<Flex.Item grow={0}>
						<Box componentClassName='rc-popover__icon'><Icon name={icon} size={20}/></Box>
					</Flex.Item>
					<Margins inline='x8'>
						<Flex.Item grow={1}>
							<Box is='span' fontScale='p2'>{text}</Box>
						</Flex.Item>
					</Margins>
					<Flex.Item grow={0}>
						{input}
					</Flex.Item>
				</Box>
			</Flex.Container>
		</Box>
	</Flex.Container>;
}
const style = {
	textTransform: 'uppercase',
};
export function SortList() {
	return <>
		<div className='rc-popover__column'>
			<SortModeList/>
			<ViewModeList/>
			<GroupingList/>
		</div>
	</>;
}

SortList.displayName = 'SortList';

function SortModeList() {
	const t = useTranslation();
	const saveUserPreferences = useMethod('saveUserPreferences');
	const sidebarSortBy = useUserPreference('sidebarSortby', 'activity');

	const handleChange = (value) => () => saveUserPreferences({ sidebarSortby: value });

	const setToAlphabetical = useCallback(handleChange('alphabetical'), []);
	const setToActivity = useCallback(handleChange('activity'), []);

	return <>
		<Margins block='x8'>
			<Box is='p' style={style} fontScale='micro'>{t('Sort_By')}</Box>
		</Margins>
		<ul className='rc-popover__list'>
			<Margins block='x8'>
				<SortListItem icon={'sort'} text={t('Alphabetical')} input={<RadioButton name='sidebarSortby' onChange={setToAlphabetical} checked={sidebarSortBy === 'alphabetical'} />} />
				<SortListItem icon={'clock'} text={t('Activity')} input={<RadioButton name='sidebarSortby' onChange={setToActivity} checked={sidebarSortBy === 'activity'} />} />
			</Margins>
		</ul>
	</>;
}


function ViewModeList() {
	const t = useTranslation();

	const saveUserPreferences = useMethod('saveUserPreferences');

	const handleChange = (value) => () => saveUserPreferences({ sidebarViewMode: value });

	const sidebarViewMode = useUserPreference('sidebarViewMode', 'extended');
	const sidebarHideAvatar = useUserPreference('sidebarHideAvatar', false);

	const setToExtended = useCallback(handleChange('extended'), []);
	const setToMedium = useCallback(handleChange('medium'), []);
	const setToCondensed = useCallback(handleChange('condensed'), []);

	const handleChangeSidebarHideAvatar = useCallback(() => saveUserPreferences({ sidebarHideAvatar: !sidebarHideAvatar }), [sidebarHideAvatar]);

	return <>
		<Margins block='x8'>
			<Box is='p' style={style} fontScale='micro'>{t('View_mode')}</Box>
		</Margins>
		<ul className='rc-popover__list'>
			<Margins block='x8'>
				<SortListItem icon={'th-list'} text={t('Extended')} input={<RadioButton onChange={setToExtended} name='sidebarViewMode' value='extended' checked={sidebarViewMode === 'extended'} />} />
				<SortListItem icon={'list'} text={t('Medium')} input={<RadioButton onChange={setToMedium} name='sidebarViewMode' value='medium' checked={sidebarViewMode === 'medium'} />} />
				<SortListItem icon={'list-alt'} text={t('Condensed')} input={<RadioButton onChange={setToCondensed} name='sidebarViewMode' value='condensed' checked={sidebarViewMode === 'condensed'} />} />
				<SortListItem icon={'user-rounded'} text={t('Hide_Avatars')} input={<ToggleSwitch onChange={handleChangeSidebarHideAvatar} name='sidebarHideAvatar' checked={sidebarHideAvatar} />} />
			</Margins>
		</ul>
	</>;
}


function GroupingList() {
	const sidebarShowDiscussion = useUserPreference('sidebarShowDiscussion');
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const sidebarShowFavorites = useUserPreference('sidebarShowFavorites');
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');

	const saveUserPreferences = useMethod('saveUserPreferences');

	const handleChange = (key, value) => () => saveUserPreferences({ [key]: value });

	const handleChangeShowDicussion = useCallback(handleChange('sidebarShowDiscussion', !sidebarShowDiscussion), [sidebarShowDiscussion]);
	const handleChangeGroupByType = useCallback(handleChange('sidebarGroupByType', !sidebarGroupByType), [sidebarGroupByType]);
	const handleChangeShoFavorite = useCallback(handleChange('sidebarShowFavorites', !sidebarShowFavorites), [sidebarShowFavorites]);
	const handleChangeShowUnread = useCallback(handleChange('sidebarShowUnread', !sidebarShowUnread), [sidebarShowUnread]);


	const t = useTranslation();
	return <>
		<Margins block='x8'>
			<Box is='p' style={style} fontScale='micro'>{t('Grouping')}</Box>
		</Margins>
		<ul className='rc-popover__list'>
			<Margins block='x8'>
				<SortListItem icon={'discussion'} text={t('Group_discussions')} input={<ToggleSwitch onChange={handleChangeShowDicussion} name='sidebarShowDiscussion' checked={sidebarShowDiscussion} />} />
				<SortListItem icon={'sort-amount-down'} text={t('Group_by_Type')} input={<ToggleSwitch onChange={handleChangeGroupByType} name='sidebarGroupByType' checked={sidebarGroupByType} />} />
				<SortListItem icon={'star'} text={t('Group_favorites')} input={<ToggleSwitch onChange={handleChangeShoFavorite} name='sidebarShowFavorites' checked={sidebarShowFavorites} />} />
				<SortListItem icon={'eye-off'} text={t('Unread_on_top')} input={<ToggleSwitch onChange={handleChangeShowUnread} name='sidebarShowUnread' checked={sidebarShowUnread} />} />
			</Margins>
		</ul>
	</>;
}

export default SortList;
