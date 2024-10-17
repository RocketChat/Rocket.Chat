import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import RoomAnnouncement from '.';

export default {
	title: 'Room/RoomAnnouncement',
	component: RoomAnnouncement,
} satisfies Meta<typeof RoomAnnouncement>;

export const Default: StoryFn<typeof RoomAnnouncement> = (args) => <RoomAnnouncement {...args} />;
Default.storyName = 'Announcement';
Default.args = {
	announcement: 'Lorem Ipsum Indolor',
	announcementDetails: action('announcementDetails'),
};
