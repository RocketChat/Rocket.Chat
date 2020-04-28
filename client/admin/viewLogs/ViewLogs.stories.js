import React from 'react';

import ViewLogs from './ViewLogs';

export default {
	title: 'admin/pages/ViewLogs',
	component: ViewLogs,
	decorators: [
		(storyFn) => <div className='rc-old' style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
			{storyFn()}
		</div>,
	],
};

export const _default = () =>
	<ViewLogs />;
