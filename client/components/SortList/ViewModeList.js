import { ToggleSwitch, RadioButton, Box, Margins } from '@rocket.chat/fuselage';
import React, { useCallback } from 'react';

import { useMethod } from '../../contexts/ServerContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useUserPreference } from '../../contexts/UserContext';
import SortListItem from './SortListItem';

const style = {
	textTransform: 'uppercase',
};

function ViewModeList() {
	const t = useTranslation();

	const saveUserPreferences = useMethod('saveUserPreferences');

	const useHandleChange = (value) =>
		useCallback(() => saveUserPreferences({ sidebarViewMode: value }), [value]);

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
			<Margins block='x8'>
				<Box is='p' style={style} fontScale='micro'>
					{t('Display')}
				</Box>
			</Margins>
			<ul className='rc-popover__list'>
				<Margins block='x8'>
					<SortListItem
						icon={'extended-view'}
						text={t('Extended')}
						input={
							<RadioButton
								onChange={setToExtended}
								name='sidebarViewMode'
								value='extended'
								checked={sidebarViewMode === 'extended'}
							/>
						}
					/>
					<SortListItem
						icon={'medium-view'}
						text={t('Medium')}
						input={
							<RadioButton
								onChange={setToMedium}
								name='sidebarViewMode'
								value='medium'
								checked={sidebarViewMode === 'medium'}
							/>
						}
					/>
					<SortListItem
						icon={'condensed-view'}
						text={t('Condensed')}
						input={
							<RadioButton
								onChange={setToCondensed}
								name='sidebarViewMode'
								value='condensed'
								checked={sidebarViewMode === 'condensed'}
							/>
						}
					/>
					<SortListItem
						icon={'user-rounded'}
						text={t('Avatars')}
						input={
							<ToggleSwitch
								onChange={handleChangeSidebarDisplayAvatar}
								name='sidebarDisplayAvatar'
								checked={sidebarDisplayAvatar}
							/>
						}
					/>
				</Margins>
			</ul>
		</>
	);
}

export default ViewModeList;
