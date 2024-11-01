import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import Announcement from '.';

export default {
	title: 'Room/Announcement',
	component: Announcement,
} satisfies Meta<typeof Announcement>;

export const Default: StoryFn<typeof Announcement> = (args) => <Announcement {...args} />;
Default.storyName = 'Announcement';
Default.args = {
	announcement: 'Lorem Ipsum Indolor',
	announcementDetails: action('announcementDetails'),
};
