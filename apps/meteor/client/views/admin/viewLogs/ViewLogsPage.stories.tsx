import type { StoryObj, Meta } from '@storybook/react';

import ViewLogsPage from './ViewLogsPage';

export default {
	component: ViewLogsPage,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
	decorators: [(fn) => <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>{fn()}</div>],
} satisfies Meta<typeof ViewLogsPage>;

export const Default: StoryObj<typeof ViewLogsPage> = {
	render: () => <ViewLogsPage />,
	name: 'ViewLogsPage',
};
