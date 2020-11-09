import React, { useCallback } from 'react';
import { Icon, ToggleSwitch, RadioButton, Box, Flex, Margins, CheckBox, Divider } from '@rocket.chat/fuselage';


import { useTranslation } from '../contexts/TranslationContext';
import { useUserPreference } from '../contexts/UserContext';
import { useMethod } from '../contexts/ServerContext';
import { useSetting } from '../contexts/SettingsContext';

function SortListItem({ text, icon, input }) {
	return <Flex.Container>
		<Box is='li'>
			<Flex.Container>
				<Box is='label' className='rc-popover__label' style={{ width: '100%' }}>
					<Flex.Item grow={0}>
						<Box className='rc-popover__icon'><Icon name={icon} size={20}/></Box>
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
			<ViewModeList/>
			<Divider/>
			<SortModeList/>
			<Divider/>
			<GroupingList/>
		</div>
	</>;
}

SortList.displayName = 'SortList';

function SortModeList() {
	const t = useTranslation();
	const saveUserPreferences = useMethod('saveUserPreferences');
	const sidebarSortBy = useUserPreference('sidebarSortby', 'activity');

	const useHandleChange = (value) => useCallback(() => saveUserPreferences({ sidebarSortby: value }), [value]);

	const setToAlphabetical = useHandleChange('alphabetical');
	const setToActivity = useHandleChange('activity');

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

	const useHandleChange = (value) => useCallback(() => saveUserPreferences({ sidebarViewMode: value }), [value]);

	const sidebarViewMode = useUserPreference('sidebarViewMode', 'extended');
	const sidebarHideAvatar = useUserPreference('sidebarHideAvatar', false);

	const setToExtended = useHandleChange('extended');
	const setToMedium = useHandleChange('medium');
	const setToCondensed = useHandleChange('condensed');

	const handleChangeSidebarHideAvatar = useCallback(() => saveUserPreferences({ sidebarHideAvatar: !sidebarHideAvatar }), [saveUserPreferences, sidebarHideAvatar]);

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
	const isDiscussionEnabled = useSetting('Discussion_enabled');
	const sidebarShowDiscussion = useUserPreference('sidebarShowDiscussion');
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const sidebarShowFavorites = useUserPreference('sidebarShowFavorites');
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');

	const saveUserPreferences = useMethod('saveUserPreferences');

	const useHandleChange = (key, value) => useCallback(() => saveUserPreferences({ [key]: value }), [key, value]);

	const handleChangeShowDicussion = useHandleChange('sidebarShowDiscussion', !sidebarShowDiscussion);
	const handleChangeGroupByType = useHandleChange('sidebarGroupByType', !sidebarGroupByType);
	const handleChangeShoFavorite = useHandleChange('sidebarShowFavorites', !sidebarShowFavorites);
	const handleChangeShowUnread = useHandleChange('sidebarShowUnread', !sidebarShowUnread);


	const t = useTranslation();
	return <>
		<Margins block='x8'>
			<Box is='p' style={style} fontScale='micro'>{t('Group_by')}</Box>
		</Margins>
		<ul className='rc-popover__list'>
			<Margins block='x8'>
				{isDiscussionEnabled && <SortListItem icon={'discussion'} text={t('Discussions')} input={<CheckBox onChange={handleChangeShowDicussion} name='sidebarShowDiscussion' checked={sidebarShowDiscussion} />} />}
				<SortListItem icon={'group-by-type'} text={t('Type')} input={<CheckBox onChange={handleChangeGroupByType} name='sidebarGroupByType' checked={sidebarGroupByType} />} />
				<SortListItem icon={'star'} text={t('Favorites')} input={<CheckBox onChange={handleChangeShoFavorite} name='sidebarShowFavorites' checked={sidebarShowFavorites} />} />
				<SortListItem icon={'eye-off'} text={t('Unread_on_top')} input={<CheckBox onChange={handleChangeShowUnread} name='sidebarShowUnread' checked={sidebarShowUnread} />} />
			</Margins>
		</ul>
	</>;
}

export default SortList;
