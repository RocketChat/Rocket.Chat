import React from 'react';
import { Sidebar } from '@rocket.chat/fuselage';

import { popover } from '../../../../app/ui-utils';
import { createTemplateForComponent } from '../../../reactAdapters';

const SortList = createTemplateForComponent('SortList', () => import('../../../components/SortList'));

const config = (e) => ({
	template: SortList,
	currentTarget: e.currentTarget,
	data: {
		options: [],
	},
	offsetVertical: e.currentTarget.clientHeight + 10,
});

const onClick = (e) => { popover.open(config(e)); };

const Sort = (props) => <Sidebar.TopBar.Action {...props} icon='sort' onClick={onClick}/>;

export default Sort;
