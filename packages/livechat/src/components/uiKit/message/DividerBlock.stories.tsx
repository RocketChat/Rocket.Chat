import type { Meta } from '@storybook/preact';

import { renderMessageBlocks } from '.';

export default {
	title: 'UiKit/Message/Divider block',
	parameters: {
		layout: 'centered',
	},
	decorators: [(storyFn) => <div children={storyFn()} style={{ width: '100vw', maxWidth: 500 }} />],
} satisfies Meta;

export const Default = () =>
	renderMessageBlocks([
		{
			type: 'divider',
		},
	]);
Default.storyName = 'default';
