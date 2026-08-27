import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import RingingCallItem from './RingingCallItem';
import { conferenceAppRoot, withCallProviders } from '../../views/conference/storyFixtures';
import { buildJoinableCall } from '../../views/conference/testFixtures';

const call = buildJoinableCall({
	callId: 'ringing',
	name: 'Ada Lovelace',
	ringingAt: new Date(),
	usersCount: 1,
	participants: [{ _id: 'ada', username: 'ada', name: 'Ada Lovelace' }],
});

/**
 * One row of a call that is ringing. Whether it can be silenced is not a prop: the row asks whether *this*
 * client is the one making the noise, so the stories differ in what the video-conf context reports as incoming.
 */
const meta = {
	component: RingingCallItem,
	parameters: { layout: 'centered' },
	args: {
		call,
		silenced: false,
		onAccept: action('onAccept'),
		onReject: action('onReject'),
		onSilence: action('onSilence'),
	},
	decorators: [
		(Story) => (
			<Box width='x280' borderRadius='x8' backgroundColor='surface-light'>
				<Story />
			</Box>
		),
		withCallProviders(conferenceAppRoot().withIncomingCalls([{ callId: 'ringing', dismissed: false }] as any)),
	],
} satisfies Meta<typeof RingingCallItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Sounding here: Silence and Decline, and "Ringing…" in place of the time. */
export const Audible: Story = {};

/** Quietened. The Silence button becomes a struck-through bell; Decline is still the way to turn it down. */
export const Silenced: Story = {
	args: { silenced: true },
};

/**
 * A ring this client never heard, so there is no noise of its own to stop — only Decline. The row still says
 * it is ringing, because it is: somewhere else.
 */
export const NotHeardHere: Story = {
	decorators: [withCallProviders(conferenceAppRoot())],
};
