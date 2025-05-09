import type { Meta, StoryFn } from '@storybook/react';

import RoomAnnouncement from '.';

export default {
	title: 'Room/RoomAnnouncement',
	component: RoomAnnouncement,
} satisfies Meta<typeof RoomAnnouncement>;

export const Default: StoryFn<typeof RoomAnnouncement> = (args) => <RoomAnnouncement {...args} />;
Default.args = {
	announcement: 'Lorem Ipsum Indolor',
};
