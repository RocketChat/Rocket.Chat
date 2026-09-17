import type { StoryObj, Meta } from '@storybook/react';

import RoomAnnouncement from '.';

export default {
	component: RoomAnnouncement,
} satisfies Meta<typeof RoomAnnouncement>;

export const Default: StoryObj<typeof RoomAnnouncement> = {
	args: {
		announcement: 'Lorem Ipsum Indolor',
	},
};
