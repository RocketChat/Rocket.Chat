import { Sidebar } from '@rocket.chat/fuselage';
import React from 'react';

import { popover } from '../../../../app/ui-utils';

const config = (e) => ({
	template: 'SortList',
	currentTarget: e.currentTarget,
	data: {
		options: [],
	},
	offsetVertical: e.currentTarget.clientHeight + 10,
});

const onClick = (e) => {
	popover.open(config(e));
};

const Sort = (props) => <Sidebar.TopBar.Action {...props} icon='sort' onClick={onClick} />;

export default Sort;
