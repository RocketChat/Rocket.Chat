import React, { ReactElement, ReactNode } from 'react';

import ViewLogsPage from './ViewLogsPage';

export default {
	title: 'admin/pages/ViewLogsPage',
	component: ViewLogsPage,
	decorators: [
		(fn: () => ReactNode): ReactElement => (
			<div className='rc-old' style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
				{fn()}
			</div>
		),
	],
};

export const _default = (): ReactElement => <ViewLogsPage />;
