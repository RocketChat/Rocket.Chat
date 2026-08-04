import type { Meta, StoryObj } from '@storybook/preact';

import { renderMessageBlocks } from '.';

export default {
	parameters: {
		layout: 'centered',
	},
	decorators: [(storyFn) => <div style={{ width: '100vw', maxWidth: 500 }}>{storyFn()}</div>],
} satisfies Meta;

export const Default: StoryObj = {
	name: 'default',
	render: () => (
		<>
			{renderMessageBlocks([
				{
					type: 'divider',
				},
			])}
		</>
	),
};
