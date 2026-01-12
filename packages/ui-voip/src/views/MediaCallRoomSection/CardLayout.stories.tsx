import type { Meta, StoryFn } from '@storybook/react';

import CardGrid from './CardGrid';

export default {
	title: 'V2/Views/MediaCallRoomSection/CardLayout',
	component: CardGrid,
	args: {
		// title: 'Generic Card',
		// children: 'This is the content.',
		// slots: {
		// 	topLeft: 'Top Left',
		// 	topRight: 'Top Right',
		// 	bottomLeft: 'Bottom Left',
		// 	bottomRight: 'Bottom Right',
		// },
	},
} satisfies Meta<typeof CardGrid>;

export const CardGridStory: StoryFn<typeof CardGrid> = (args) => <CardGrid {...args} />;
