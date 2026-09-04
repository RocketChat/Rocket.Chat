import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import AddParticipantsModal from './AddParticipantsModal';
import { conferenceAppRoot, storeCallPreferences, withCallProviders } from '../../storyFixtures';

/**
 * Adding people to a call in progress. They become members of the *conference*, which is what lets them join —
 * it deliberately puts them in no room, and whether they can read the chat is surfaced separately.
 *
 * The picker is the product's own user autocomplete, so it asks the server as you type. Here that endpoint
 * returns a fixed handful, which keeps the story off the network while leaving the picker itself real: type a
 * letter to see the options. No room is seeded, so nobody is excluded as an existing member.
 */
const meta = {
	component: AddParticipantsModal,
	parameters: { layout: 'centered' },
	args: {
		callId: 'call-1',
		rid: 'room-id',
		onClose: action('onClose'),
	},
	decorators: [
		withCallProviders(
			conferenceAppRoot()
				.withEndpoint('POST', '/v1/video-conference.add-participants', () => ({ added: ['grace'], success: true }) as any)
				.withEndpoint(
					'GET',
					'/v1/users.autocomplete',
					() =>
						({
							items: [
								{ _id: 'grace', username: 'grace', name: 'Grace Hopper' },
								{ _id: 'alan', username: 'alan', name: 'Alan Turing' },
								{ _id: 'katherine', username: 'katherine', name: 'Katherine Johnson' },
							],
							success: true,
						}) as any,
				),
		),
	],
	beforeEach: storeCallPreferences({ ring: true }),
} satisfies Meta<typeof AddParticipantsModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Nothing chosen yet, so Add is disabled. Ringing is on, which is the remembered default. */
export const Empty: Story = {};

/**
 * With ringing turned off — the same habit the preflight remembers, asked here for the same reason: someone
 * added so they can join later is not someone to interrupt now.
 */
export const NotRinging: Story = {
	beforeEach: storeCallPreferences({ ring: false }),
};
