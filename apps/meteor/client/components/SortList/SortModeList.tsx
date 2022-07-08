import { RadioButton, OptionTitle } from '@rocket.chat/fuselage';
import { useUserPreference, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback } from 'react';

import { useEndpointActionExperimental } from '../../hooks/useEndpointActionExperimental';
import ListItem from '../Sidebar/ListItem';

const style = {
	textTransform: 'uppercase',
};

const checkBoxStyle = {
	paddingLeft: '24px',
	paddingInlineStart: '24px',
};

function SortModeList(): ReactElement {
	const t = useTranslation();
	const saveUserPreferences = useEndpointActionExperimental('POST', '/v1/users.setPreferences');
	const sidebarSortBy = useUserPreference<'activity' | 'alphabetical'>('sidebarSortby', 'activity');

	const useHandleChange = (value: 'alphabetical' | 'activity'): (() => void) =>
		useCallback(() => saveUserPreferences({ data: { sidebarSortby: value } }), [value]);

	const setToAlphabetical = useHandleChange('alphabetical');
	const setToActivity = useHandleChange('activity');

	return (
		<>
			<OptionTitle {...({ style } as any)}>{t('Sort_By')}</OptionTitle>
			<ul className='rc-popover__list'>
				<ListItem
					icon={'clock'}
					text={t('Activity')}
					input={<RadioButton style={checkBoxStyle} name='sidebarSortby' onChange={setToActivity} checked={sidebarSortBy === 'activity'} />}
				/>
				<ListItem
					icon={'sort-az'}
					text={t('Name')}
					input={
						<RadioButton
							style={checkBoxStyle}
							name='sidebarSortby'
							onChange={setToAlphabetical}
							checked={sidebarSortBy === 'alphabetical'}
						/>
					}
				/>
			</ul>
		</>
	);
}

export default SortModeList;
