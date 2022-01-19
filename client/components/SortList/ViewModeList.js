import { ToggleSwitch, RadioButton, OptionTitle } from '@rocket.chat/fuselage';
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

function ViewModeList() {
	const t = useTranslation();

	const saveUserPreferences = useMethod('saveUserPreferences');

	const useHandleChange = (value) => useCallback(() => saveUserPreferences({ sidebarViewMode: value }), [value]);

	const sidebarViewMode = useUserPreference('sidebarViewMode', 'extended');
	const sidebarDisplayAvatar = useUserPreference('sidebarDisplayAvatar', false);

	const setToExtended = useHandleChange('extended');
	const setToMedium = useHandleChange('medium');
	const setToCondensed = useHandleChange('condensed');

	const handleChangeSidebarDisplayAvatar = useCallback(
		() => saveUserPreferences({ sidebarDisplayAvatar: !sidebarDisplayAvatar }),
		[saveUserPreferences, sidebarDisplayAvatar],
	);

	return (
		<>
			<OptionTitle style={style}>{t('Display')}</OptionTitle>
			<ul className='rc-popover__list'>
				<ListItem
					icon={'extended-view'}
					text={t('Extended')}
					input={
						<RadioButton
							style={checkBoxStyle}
							onChange={setToExtended}
							name='sidebarViewMode'
							value='extended'
							checked={sidebarViewMode === 'extended'}
						/>
					}
				/>
				<ListItem
					icon={'medium-view'}
					text={t('Medium')}
					input={
						<RadioButton
							style={checkBoxStyle}
							onChange={setToMedium}
							name='sidebarViewMode'
							value='medium'
							checked={sidebarViewMode === 'medium'}
						/>
					}
				/>
				<ListItem
					icon={'condensed-view'}
					text={t('Condensed')}
					input={
						<RadioButton
							style={checkBoxStyle}
							onChange={setToCondensed}
							name='sidebarViewMode'
							value='condensed'
							checked={sidebarViewMode === 'condensed'}
						/>
					}
				/>
				<ListItem
					icon={'user-rounded'}
					text={t('Avatars')}
					input={
						<ToggleSwitch
							style={checkBoxStyle}
							onChange={handleChangeSidebarDisplayAvatar}
							name='sidebarDisplayAvatar'
							checked={sidebarDisplayAvatar}
						/>
					}
				/>
			</ul>
		</>
	);
}

export default ViewModeList;
