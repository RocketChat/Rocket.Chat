import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import ConferenceStatePage from './ConferenceStatePage.js';
import { conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures.js';

/** A conference window that cannot show a call, in each of the icon's variations. */
const meta = {
	component: ConferenceStatePage,
	parameters: { layout: 'fullscreen' },
	args: {
		action: { label: 'Close', onClick: action('onClick') },
	},
	decorators: [withConferenceWindow(conferenceAppRoot())],
} satisfies Meta<typeof ConferenceStatePage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Something went wrong. */
export const Danger: Story = {
	args: { icon: 'warning', title: 'Something went wrong', variation: 'danger' },
};

/** Nothing went wrong; the call is simply not there yet. */
export const Neutral: Story = {
	args: { icon: 'clock', title: 'Weekly sync has not started yet', variation: 'neutral' },
};
