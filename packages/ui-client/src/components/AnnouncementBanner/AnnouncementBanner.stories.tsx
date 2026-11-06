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

/**
 * A banner that only announces. Nothing happens on click, so nothing offers to be clicked: no pointer, no
 * underline on hover — the affordances the clickable case shows are exactly what would be a lie here.
 */
export const NotClickable: StoryObj<typeof AnnouncementBanner> = {
	args: {
		onClick: undefined,
		children: 'Announcement',
	},
};
