import { MultiSelect } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import AddParticipantsModal from './AddParticipantsModal';
import { conferenceAppRoot, storeCallPreferences, withCallProviders, withConference } from '../../fixtures/storyFixtures';

/**
 * Adding people to a call in progress. They become members of the *conference*, which is what lets them join —
 * it deliberately puts them in no room, and whether they can read the chat is surfaced separately.
 *
 * The picker is handed in rather than built here: which names are on offer, and which are already in the room,
 * is a question about the room, and reading the room is the application's. The stand-in below is a plain
 * multi-select over a fixed handful, so the modal's own behaviour — the limit, the ring habit, what it reports —
 * is what these stories show.
 */
const options: [string, string][] = [
	['grace', 'Grace Hopper'],
	['alan', 'Alan Turing'],
	['katherine', 'Katherine Johnson'],
];

const meta = {
	component: AddParticipantsModal,
	parameters: { layout: 'centered' },
	args: {
		onClose: action('onClose'),
	},
	decorators: [
		withConference({
			slots: {
				renderUserPicker: ({ value, onChange, placeholder }) => (
					<MultiSelect options={options} value={value} placeholder={placeholder} onChange={(next) => onChange(next)} width='100%' />
				),
			},
		}),
		// The ring control is only offered to a caller the workspace lets ring people, and it is half of what
		// these stories are about.
		withCallProviders(conferenceAppRoot().withPermission('videoconf-ring-users')),
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

/** A caller the workspace does not let ring people: no question about ringing, because there is no choice. */
export const WithoutRingPermission: Story = {
	decorators: [withCallProviders(conferenceAppRoot())],
};
