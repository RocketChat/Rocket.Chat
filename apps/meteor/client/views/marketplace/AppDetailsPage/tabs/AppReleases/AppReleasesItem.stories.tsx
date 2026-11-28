import { Accordion } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';

import AppReleasesItem from './AppReleasesItem';

export default {
	component: AppReleasesItem,
	decorators: [
		(Story) => (
			<Accordion>
				<Story />
			</Accordion>
		),
	],
} satisfies Meta<typeof AppReleasesItem>;

type Story = StoryObj<typeof AppReleasesItem>;

export const Default: Story = {
	args: {
		release: {
			version: '2.4.0',
			createdDate: '2024-03-01T12:00:00.000Z',
			detailedChangelog: {
				raw: '- Adds the daily report\n- Fixes the room picker',
				rendered: '<ul><li>Adds the daily report</li><li>Fixes the room picker</li></ul>',
			},
		},
	},
};

export const WithoutChangelog: Story = {
	args: {
		release: {
			version: '2.3.1',
			createdDate: '2024-01-10T12:00:00.000Z',
			detailedChangelog: { raw: '', rendered: '' },
		},
	},
};
