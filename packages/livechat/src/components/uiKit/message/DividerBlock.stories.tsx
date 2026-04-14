import type { Meta } from '@storybook/preact';

import { renderMessageBlocks } from '.';

export default {
	title: 'UiKit/Message/Divider block',
	parameters: {
		layout: 'centered',
	},
	decorators: [(storyFn) => <div style={{ width: '100vw', maxWidth: 500 }}>{storyFn()}</div>],
} satisfies Meta;

export const Default = () =>
	renderMessageBlocks([
		{
			type: 'divider',
		},
	]);
Default.storyName = 'default';
