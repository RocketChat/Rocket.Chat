import { ComponentMeta, ComponentStory } from '@storybook/react';
import React, { ReactElement, ReactNode } from 'react';

import ViewLogsPage from './ViewLogsPage';

export default {
	title: 'Admin/View Logs/ViewLogsPage',
	component: ViewLogsPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
	decorators: [
		(fn: () => ReactNode): ReactElement => (
			<div className='rc-old' style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
				{fn()}
			</div>
		),
	],
} as ComponentMeta<typeof ViewLogsPage>;

export const Default: ComponentStory<typeof ViewLogsPage> = () => <ViewLogsPage />;
Default.storyName = 'ViewLogsPage';
