import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import CallMembersPanel from './CallMembersPanel';
import type { ConferenceChatAccess, ConferenceMember } from '../../context/definitions';
import {
	buildCallParticipant,
	conferenceAppRoot,
	members,
	speakingProvider,
	withCallProviders,
	withLiveConference,
} from '../../fixtures/storyFixtures';
import { buildChatAccess } from '../../fixtures/testFixtures';
import type { ProviderPluginControls } from '../../lib/providerPlugin';

/**
 * The people panel: who is in the call, and who isn't, under headings that count them.
 *
 * Who they are and where they stand comes with the conference rather than as props, so each story is a
 * different call. "Add people" is only offered where there is a room to add them from — a member who joined
 * from outside the room has none.
 */
const withMembers = (
	shown: ConferenceMember[],
	{ rid = 'room-id', chatAccess, provider }: { rid?: string; chatAccess?: ConferenceChatAccess; provider?: ProviderPluginControls } = {},
) => withLiveConference({ call: { members: shown }, room: { rid, chatAccess }, provider });

const meta = {
	component: CallMembersPanel,
	parameters: { layout: 'fullscreen' },
	args: {
		onClose: action('onClose'),
	},
	decorators: [
		(Story) => (
			<Box width='x400' height='x480' backgroundColor='surface-light' display='flex' flexDirection='column'>
				<Story />
			</Box>
		),
		// Ringing someone back is what half of these rows are for, and it is offered only to a caller the
		// workspace lets ring.
		withCallProviders(conferenceAppRoot().withPermission('videoconf-ring-users')),
	],
} satisfies Meta<typeof CallMembersPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Everyone is here, so there is no second heading at all. */
export const EveryoneJoined: Story = {
	decorators: [withMembers([members.joined, { ...members.left, leftAt: undefined }])],
};

/** The mix worth looking at: two in the call, and three who aren't, each labelled with why. */
export const MixedStates: Story = {
	decorators: [
		withMembers([
			members.joined,
			{ ...members.left, _id: 'present', name: 'Margaret Hamilton', username: 'margaret', leftAt: undefined },
			members.ringing,
			members.declined,
			members.left,
		]),
	],
};

/**
 * Somebody in the call can't read its chat. It shows against the member rather than as a banner here — the
 * banner is `ChatAccessNotice`'s job.
 */
export const WithoutChatAccess: Story = {
	decorators: [withMembers([members.joined, members.left], { chatAccess: buildChatAccess({ membersWithoutAccess: ['joined'] }) })],
};

/**
 * Nobody has answered yet. One member's phone is ringing and the other is only invited — rung at some point, or
 * never — which is what the two rows are for: a ring is offered to whoever isn't hearing one now.
 */
export const NobodyAnsweredYet: Story = {
	decorators: [withMembers([members.ringing, { ...members.declined, declined: false, declinedAt: undefined }])],
};

/**
 * No room behind the call, so there is nowhere to add people from and the button isn't offered.
 */
export const WithoutARoom: Story = {
	decorators: [withMembers([members.joined, members.ringing], { rid: undefined })],
};

/**
 * With a provider plugin speaking. Each member the provider has in the call carries that participant's own
 * controls — the panel offers a control only where the provider announced the feature *and* that participant's
 * flags allow it, so a button here is one the provider will honour.
 */
export const WithProviderControls: Story = {
	decorators: [
		withMembers([members.joined, members.ringing], {
			provider: speakingProvider({
				participants: [buildCallParticipant({ uuid: 'p-ada', displayName: 'Ada Lovelace' })],
				self: { participantUuid: 'p-me', micMuted: false, camMuted: false, clientMuted: false, isHost: true, canControl: true },
			}),
		}),
	],
};

/**
 * Somebody in the call the conference never invited: a guest with a link, or a telephone. There is no user
 * behind the row, because the protocol carries names and nothing else.
 */
export const WithExternalParticipant: Story = {
	decorators: [
		withMembers([members.joined], {
			provider: speakingProvider({
				participants: [
					buildCallParticipant({ uuid: 'p-ada', displayName: 'Ada Lovelace' }),
					buildCallParticipant({ uuid: 'p-guest', displayName: 'Jean Bartik (guest)' }),
				],
			}),
		}),
	],
};

/**
 * The lobby, ahead of everyone else because they are all waiting on somebody looking at this panel. Letting
 * them in is a button rather than a menu item — it is the only thing anyone wants to do here.
 */
export const WithLobby: Story = {
	decorators: [
		withMembers([members.joined], {
			provider: speakingProvider({
				participants: [
					buildCallParticipant({ uuid: 'p-ada', displayName: 'Ada Lovelace' }),
					buildCallParticipant({ uuid: 'p-waiting', displayName: 'Margaret Hamilton', isWaiting: true }),
				],
			}),
		}),
	],
};

/**
 * The same call under a provider that announced only its roster. Nothing is offered, because nothing would be
 * carried out — the protocol answers no request, so a control that fails looks exactly like one that worked.
 */
export const WithoutAnnouncedControls: Story = {
	decorators: [
		withMembers([members.joined], {
			provider: speakingProvider({
				features: ['roster'],
				participants: [buildCallParticipant({ uuid: 'p-ada', displayName: 'Ada Lovelace' })],
			}),
		}),
	],
};
