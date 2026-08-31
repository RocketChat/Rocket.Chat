import type { Meta, StoryObj } from '@storybook/preact';

import { renderMessageBlocks } from '.';
import { imageBlock } from '../../../../.storybook/helpers';

export default {
	parameters: {
		layout: 'centered',
	},
	decorators: [(storyFn) => <div style={{ width: '100vw', maxWidth: 500 }}>{storyFn()}</div>],
} satisfies Meta;

export const WithTitle: StoryObj = {
	name: 'with title',
	render: () => (
		<>
			{renderMessageBlocks([
				{
					type: 'image',
					title: {
						type: 'plain_text',
						text: 'SpaceX Falcon Heavy Launch',
						emoji: true,
					},
					imageUrl: imageBlock,
					altText: 'Photo by SpaceX on Unsplash',
				},
			])}
		</>
	),
};

export const WithNoTitle: StoryObj = {
	name: 'with no title',
	render: () => (
		<>
			{renderMessageBlocks([
				{
					type: 'image',
					imageUrl: imageBlock,
					altText: 'Photo by SpaceX on Unsplash',
				},
			])}
		</>
	),
};
