import { ToggleSwitch, RadioButton, OptionTitle } from '@rocket.chat/fuselage';
import { useUserPreference, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import ListItem from '../Sidebar/ListItem';

function ViewModeList(): ReactElement {
	const t = useTranslation();

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const useHandleChange = (value: 'medium' | 'extended' | 'condensed'): (() => void) =>
		useCallback(() => saveUserPreferences({ data: { sidebarViewMode: value } }), [value]);

	const sidebarViewMode = useUserPreference<'medium' | 'extended' | 'condensed'>('sidebarViewMode', 'extended');
	const sidebarDisplayAvatar = useUserPreference('sidebarDisplayAvatar', false);

	const setToExtended = useHandleChange('extended');
	const setToMedium = useHandleChange('medium');
	const setToCondensed = useHandleChange('condensed');

	const handleChangeSidebarDisplayAvatar = useCallback(
		() => saveUserPreferences({ data: { sidebarDisplayAvatar: !sidebarDisplayAvatar } }),
		[saveUserPreferences, sidebarDisplayAvatar],
	);

	return (
		<>
			<OptionTitle>{t('Display')}</OptionTitle>
			<ul>
				<ListItem
					icon={'extended-view'}
					text={t('Extended')}
					input={
						<RadioButton
							pis='x24'
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
						<RadioButton pis='x24' onChange={setToMedium} name='sidebarViewMode' value='medium' checked={sidebarViewMode === 'medium'} />
					}
				/>
				<ListItem
					icon={'condensed-view'}
					text={t('Condensed')}
					input={
						<RadioButton
							pis='x24'
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
							pis='x24'
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
