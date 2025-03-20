import type { Meta, StoryFn } from '@storybook/react';
import type { ReactElement, ReactNode } from 'react';

import ViewLogsPage from './ViewLogsPage';

export default {
	title: 'Admin/View Logs/ViewLogsPage',
	component: ViewLogsPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
	decorators: [
		(fn: () => ReactNode): ReactElement => <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>{fn()}</div>,
	],
} satisfies Meta<typeof ViewLogsPage>;

export const Default: StoryFn<typeof ViewLogsPage> = () => <ViewLogsPage />;
Default.storyName = 'ViewLogsPage';
