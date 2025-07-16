import { action } from '@storybook/addon-actions';
import { Meta, StoryFn } from '@storybook/react';

import AnnouncementBanner from './AnnouncementBanner';

export default {
	title: 'Components/AnnouncementBanner',
	component: AnnouncementBanner,
	args: {
		onClick: action('clicked'),
	},
} satisfies Meta<typeof AnnouncementBanner>;

const Template: StoryFn<typeof AnnouncementBanner> = (args) => <AnnouncementBanner {...args} />;

export const Default = Template.bind({});
Default.args = {
	children: 'Announcement',
};

export const WithLink = Template.bind({});
WithLink.args = {
	children: (
		<a target='_blank' href='https://rocket.chat'>
			Announcement
		</a>
	),
};
