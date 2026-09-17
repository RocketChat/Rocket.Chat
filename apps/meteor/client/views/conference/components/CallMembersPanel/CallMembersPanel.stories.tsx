import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { action } from 'storybook/actions';

import CallMembersPanel from './CallMembersPanel';
import { buildCallParticipant, conferenceAppRoot, members, speakingProvider, withCallProviders, withLiveRings } from '../../storyFixtures';
import { buildChatAccess } from '../../testFixtures';

/**
 * The people panel: who is in the call, and who isn't, under headings that count them.
 *
 * "Add people" is only offered where there is a room to add them from — a member who joined from outside the
 * room has none.
 */
const meta = {
	component: CallMembersPanel,
	parameters: { layout: 'fullscreen' },
	args: {
		callId: 'call-1',
		rid: 'room-id',
		onClose: action('onClose'),
	},
	decorators: [
		(Story) => (
			<Box width='x400' height='x480' backgroundColor='surface-light' display='flex' flexDirection='column'>
				<Story />
			</Box>
		),
		// A ring lapses fifteen seconds after it is stamped, and `members.ringing` is stamped when its module
		// loads — so without this the rows documented as ringing are only ringing for whoever looks first.
		withLiveRings<ComponentProps<typeof CallMembersPanel>>(({ members: shown }, ringingAt) => ({
			members: shown.map((member) => (member.ringingAt ? { ...member, ringingAt } : member)),
		})),
		withCallProviders(
			conferenceAppRoot()
				// Ringing someone back is what half of these rows are for, and it is offered only to a caller the
				// workspace lets ring.
				.withPermission('videoconf-ring-users')
				.withEndpoint('POST', '/v1/video-conference.ring', () => ({ success: true }) as any)
				.withEndpoint('POST', '/v1/video-conference.add-participants', () => ({ added: [], success: true }) as any)
				.withEndpoint('GET', '/v1/users.autocomplete', () => ({ items: [], success: true }) as any),
		),
	],
} satisfies Meta<typeof CallMembersPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Everyone is here, so there is no second heading at all. */
export const EveryoneJoined: Story = {
	args: { members: [members.joined, { ...members.left, leftAt: undefined }] },
};

/** The mix worth looking at: two in the call, and three who aren't, each labelled with why. */
export const MixedStates: Story = {
	args: {
		members: [
			members.joined,
			{ ...members.left, _id: 'present', name: 'Margaret Hamilton', username: 'margaret', leftAt: undefined },
			members.ringing,
			members.declined,
			members.left,
		],
	},
};

/**
 * Somebody in the call can't read its chat. It shows against the member rather than as a banner here — the
 * banner is `ChatAccessNotice`'s job.
 */
export const WithoutChatAccess: Story = {
	args: {
		members: [members.joined, members.left],
		chatAccess: buildChatAccess({ membersWithoutAccess: ['joined'] }),
	},
};

/**
 * Nobody has answered yet. One member's phone is ringing and the other is only invited — rung at some point, or
 * never — which is what the two rows are for: a ring is offered to whoever isn't hearing one now.
 */
export const NobodyAnsweredYet: Story = {
	args: { members: [members.ringing, { ...members.declined, declined: false, declinedAt: undefined }] },
};

/**
 * No room behind the call, so there is nowhere to add people from and the button isn't offered.
 */
export const WithoutARoom: Story = {
	args: { rid: undefined, members: [members.joined, members.ringing] },
};

/**
 * With a provider plugin speaking. Each member the provider has in the call carries that participant's own
 * controls — the panel offers a control only where the provider announced the feature *and* that participant's
 * flags allow it, so a button here is one the provider will honour.
 */
export const WithProviderControls: Story = {
	args: {
		members: [members.joined, members.ringing],
		provider: speakingProvider({
			participants: [buildCallParticipant({ uuid: 'p-ada', displayName: 'Ada Lovelace' })],
			self: { participantUuid: 'p-me', micMuted: false, camMuted: false, clientMuted: false, isHost: true, canControl: true },
		}),
	},
};

/**
 * Somebody in the call the conference never invited: a guest with a link, or a telephone. There is no user
 * behind the row, because the protocol carries names and nothing else.
 */
export const WithExternalParticipant: Story = {
	args: {
		members: [members.joined],
		provider: speakingProvider({
			participants: [
				buildCallParticipant({ uuid: 'p-ada', displayName: 'Ada Lovelace' }),
				buildCallParticipant({ uuid: 'p-guest', displayName: 'Jean Bartik (guest)' }),
			],
		}),
	},
};

/**
 * The lobby, ahead of everyone else because they are all waiting on somebody looking at this panel. Letting
 * them in is a button rather than a menu item — it is the only thing anyone wants to do here.
 */
export const WithLobby: Story = {
	args: {
		members: [members.joined],
		provider: speakingProvider({
			participants: [
				buildCallParticipant({ uuid: 'p-ada', displayName: 'Ada Lovelace' }),
				buildCallParticipant({ uuid: 'p-waiting', displayName: 'Margaret Hamilton', isWaiting: true }),
			],
		}),
	},
};

/**
 * The same call under a provider that announced only its roster. Nothing is offered, because nothing would be
 * carried out — the protocol answers no request, so a control that fails looks exactly like one that worked.
 */
export const WithoutAnnouncedControls: Story = {
	args: {
		members: [members.joined],
		provider: speakingProvider({
			features: ['roster'],
			participants: [buildCallParticipant({ uuid: 'p-ada', displayName: 'Ada Lovelace' })],
		}),
	},
};
