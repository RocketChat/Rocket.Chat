import { OptionDivider } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import GroupingList from './GroupingList';
import SortModeList from './SortModeList';
import ViewModeList from './ViewModeList';

function SortList(): ReactElement {
	return (
		<>
			<ViewModeList />
			<OptionDivider />
			<SortModeList />
			<OptionDivider />
			<GroupingList />
		</>
	);
}

export default SortList;
