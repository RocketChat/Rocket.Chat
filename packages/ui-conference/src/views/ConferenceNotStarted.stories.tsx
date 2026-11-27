import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import ConferenceNotStarted from './ConferenceNotStarted.js';
import { conferenceAppRoot, onPhone, withConferenceWindow } from '../fixtures/storyFixtures.js';

/** A conference link opened before anyone started its conference, by someone who cannot start it. */
const meta = {
	component: ConferenceNotStarted,
	parameters: { layout: 'fullscreen' },
	args: {
		title: 'Weekly sync',
		onClose: action('onClose'),
	},
	decorators: [withConferenceWindow(conferenceAppRoot())],
} satisfies Meta<typeof ConferenceNotStarted>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A name with no spaces to break on still has to wrap inside the page. */
export const LongTitle: Story = {
	args: { title: 'Quarterly-planning-for-the-platform-and-infrastructure-teams-with-every-stakeholder-invited' },
};

export const OnPhone: Story = {
	...onPhone('phonePortrait'),
};
