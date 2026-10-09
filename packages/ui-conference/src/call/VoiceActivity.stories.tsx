import type { Meta, StoryObj } from '@storybook/react';

import VoiceActivity from './VoiceActivity';
import { CallSurface, conferenceAppRoot, withConferenceWindow } from '../fixtures/storyFixtures';

/** Three bars that rise and fall with how loudly someone is talking; handed a level, it measures nothing itself. */
const meta = {
	component: VoiceActivity,
	parameters: { layout: 'centered' },
	args: { size: 24 },
	decorators: [
		(Story) => (
			<CallSurface>
				<Story />
			</CallSurface>
		),
		withConferenceWindow(conferenceAppRoot()),
	],
} satisfies Meta<typeof VoiceActivity>;

export default meta;

type Story = StoryObj<typeof meta>;

/** On, and hearing nothing: three equal dots. */
export const Resting: Story = {
	args: { level: 0 },
};

export const Speaking: Story = {
	args: { level: 0.8 },
};

/** On the blue disc a tile or a member row wears it on. */
export const Badge: Story = {
	args: { level: 0.5, size: 18, badge: true },
};
