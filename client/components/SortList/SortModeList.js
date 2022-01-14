import { RadioButton, OptionTitle } from '@rocket.chat/fuselage';
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

function SortModeList() {
	const t = useTranslation();
	const saveUserPreferences = useMethod('saveUserPreferences');
	const sidebarSortBy = useUserPreference('sidebarSortby', 'activity');

	const useHandleChange = (value) => useCallback(() => saveUserPreferences({ sidebarSortby: value }), [value]);

	const setToAlphabetical = useHandleChange('alphabetical');
	const setToActivity = useHandleChange('activity');

	return (
		<>
			<OptionTitle style={style}>{t('Sort_By')}</OptionTitle>
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
