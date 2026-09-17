import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import AnnouncementBanner from './AnnouncementBanner';

export default {
	component: AnnouncementBanner,
	args: {
		onClick: action('clicked'),
	},
} satisfies Meta<typeof AnnouncementBanner>;

export const Default: StoryObj<typeof AnnouncementBanner> = {
	args: {
		children: 'Announcement',
	},
};

export const WithLink: StoryObj<typeof AnnouncementBanner> = {
	args: {
		children: (
			<a target='_blank' href='https://rocket.chat' rel='noreferrer'>
				Announcement
			</a>
		),
	},
};
