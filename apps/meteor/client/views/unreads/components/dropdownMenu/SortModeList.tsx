import { RadioButton, OptionTitle } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import ListItem from '../../../../components/Sidebar/ListItem';

function SortModeList(): ReactElement {
	const t = useTranslation();

	const [checked, setChecked] = React.useState(false);

	const setToActivity = (): void => {
		if (checked) {
			setChecked(false);
			console.log('Sort by Date');
		} else {
			setChecked(true);
			console.log('Sort Alphabetically');
		}
	};

	return (
		<>
			<OptionTitle>{t('Sort_By')}</OptionTitle>
			<ul>
				<ListItem
					icon={'clock'}
					text={t('Activity')}
					input={<RadioButton pis='x24' name='sidebarSortby' onChange={setToActivity} checked={checked} />}
				/>
				<ListItem
					icon={'sort-az'}
					text={t('Name')}
					input={<RadioButton pis='x24' name='sidebarSortby' onChange={setToActivity} checked={!checked} />}
				/>
			</ul>
		</>
	);
}

export default SortModeList;
