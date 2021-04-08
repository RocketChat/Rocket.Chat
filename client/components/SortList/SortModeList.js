import { RadioButton, Box, Margins } from '@rocket.chat/fuselage';
import React, { useCallback } from 'react';

import { useMethod } from '../../contexts/ServerContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useUserPreference } from '../../contexts/UserContext';
import SortListItem from './SortListItem';

const style = {
	textTransform: 'uppercase',
};

function SortModeList() {
	const t = useTranslation();
	const saveUserPreferences = useMethod('saveUserPreferences');
	const sidebarSortBy = useUserPreference('sidebarSortby', 'activity');

	const useHandleChange = (value) =>
		useCallback(() => saveUserPreferences({ sidebarSortby: value }), [value]);

	const setToAlphabetical = useHandleChange('alphabetical');
	const setToActivity = useHandleChange('activity');

	return (
		<>
			<Margins block='x8'>
				<Box is='p' style={style} fontScale='micro'>
					{t('Sort_By')}
				</Box>
			</Margins>
			<ul className='rc-popover__list'>
				<Margins block='x8'>
					<SortListItem
						icon={'sort-az'}
						text={t('Alphabetical')}
						input={
							<RadioButton
								name='sidebarSortby'
								onChange={setToAlphabetical}
								checked={sidebarSortBy === 'alphabetical'}
							/>
						}
					/>
					<SortListItem
						icon={'clock'}
						text={t('Activity')}
						input={
							<RadioButton
								name='sidebarSortby'
								onChange={setToActivity}
								checked={sidebarSortBy === 'activity'}
							/>
						}
					/>
				</Margins>
			</ul>
		</>
	);
}

export default SortModeList;
