import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import CallMembersPanel from './CallMembersPanel';
import { conferenceAppRoot, members, withCallProviders } from '../../storyFixtures';
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
		withCallProviders(
			conferenceAppRoot()
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
 * Nobody has answered yet — a call just started, ringing everyone. Every row offers a ring except the ones
 * already ringing.
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
