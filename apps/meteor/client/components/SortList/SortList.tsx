import { Option } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import GroupingList from './GroupingList';
import SortModeList from './SortModeList';
import ViewModeList from './ViewModeList';

function SortList(): ReactElement {
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
