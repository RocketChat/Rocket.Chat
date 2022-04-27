import { action } from '@storybook/addon-actions';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import Announcement from '.';

export default {
	title: 'Room/Announcement',
	component: Announcement,
} as ComponentMeta<typeof Announcement>;

export const Default: ComponentStory<typeof Announcement> = (args) => <Announcement {...args} />;
Default.storyName = 'Announcement';
Default.args = {
	announcement: 'Lorem Ipsum Indolor',
	announcementDetails: action('announcementDetails'),
};
