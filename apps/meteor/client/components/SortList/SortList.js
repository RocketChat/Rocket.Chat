import { Option } from '@rocket.chat/fuselage';
import React from 'react';

import GroupingList from './GroupingList';
import SortModeList from './SortModeList';
import ViewModeList from './ViewModeList';

function SortList() {
	return (
		<>
			<ViewModeList />
			<Option.Divider />
			<SortModeList />
			<Option.Divider />
			<GroupingList />
		</>
	);
}

export default SortList;
