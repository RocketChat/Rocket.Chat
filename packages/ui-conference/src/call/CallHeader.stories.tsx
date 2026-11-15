import type { Meta, StoryObj } from '@storybook/react';

import CallHeader from './CallHeader';
import { withCall } from '../fixtures/callFixtures';
import { CallSurface, conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures';

/** How long the call running in this window has been going, and what it is called. */
const meta = {
	component: CallHeader,
	parameters: { layout: 'centered' },
	decorators: [
		(Story) => (
			<CallSurface>
				<Story />
			</CallSurface>
		),
		withCall(),
		withConferenceWindow(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Named: Story = {
	args: { name: 'Weekly sync' },
};

/** A call nobody named: the timer alone. */
export const Unnamed: Story = {};
