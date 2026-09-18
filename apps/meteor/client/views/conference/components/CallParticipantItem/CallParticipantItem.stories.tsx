import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';

import CallParticipantItem from './CallParticipantItem';
import { buildCallParticipant, conferenceAppRoot, speakingProvider, withCallProviders } from '../../storyFixtures';

const provider = speakingProvider();

/**
 * Somebody in the call the conference has never heard of — a guest who followed a link, a telephone dialled in.
 *
 * There is no user behind the row: the protocol carries names and nothing else, so there is no avatar to show
 * and no presence to report. What can be done to them is the provider's answer, the same as for anybody else.
 */
const meta = {
	component: CallParticipantItem,
	parameters: { layout: 'centered' },
	args: {
		features: provider.features,
		actions: provider.actions,
	},
	decorators: [
		(Story) => (
			<Box width='x320' backgroundColor='surface-light' borderRadius='medium'>
				<Story />
			</Box>
		),
		withCallProviders(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallParticipantItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: { participant: buildCallParticipant({ uuid: 'p-guest', displayName: 'Jean Bartik (guest)' }) },
};

/** Waiting to be let in, which is the one thing anyone wants to do about them — so it is a button, not a menu. */
export const InTheLobby: Story = {
	args: { participant: buildCallParticipant({ uuid: 'p-lobby', displayName: 'Margaret Hamilton', isWaiting: true }) },
};

/** Pexip has no name for some participants — a device, a dial-in — and sends none. */
export const Unnamed: Story = {
	args: { participant: buildCallParticipant({ uuid: 'p-phone', displayName: '' }) },
};

/**
 * Muted and spotlit, so the menu offers the opposite of each. The row is read from the roster every time rather
 * than remembering what was asked: nothing answers a request, so there is no reply to learn the outcome from.
 */
export const MutedAndSpotlit: Story = {
	args: { participant: buildCallParticipant({ uuid: 'p-guest', displayName: 'Jean Bartik (guest)', isMuted: true, isSpotlight: true }) },
};

/** What the provider refuses is not offered: these flags leave nothing but a transfer and a spotlight. */
export const WithMostControlsRefused: Story = {
	args: {
		participant: buildCallParticipant({
			uuid: 'p-guest',
			displayName: 'Jean Bartik (guest)',
			can: {
				control: false,
				mute: false,
				disconnect: false,
				transfer: true,
				spotlight: true,
				fecc: false,
				raiseHand: false,
				changeLayout: false,
			},
		}),
	},
};
