import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import RoomAnnouncement from '.';

export default {
	title: 'Room/Announcement',
	component: RoomAnnouncement,
} as ComponentMeta<typeof RoomAnnouncement>;

export const Default: ComponentStory<typeof RoomAnnouncement> = (args) => <RoomAnnouncement {...args} />;
Default.storyName = 'Announcement';
Default.args = {
	announcement: 'Lorem Ipsum Indolor',
	announcementDetails: action('announcementDetails'),
};
