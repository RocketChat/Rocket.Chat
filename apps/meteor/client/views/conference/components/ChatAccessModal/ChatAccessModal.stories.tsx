import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import ChatAccessModal from './ChatAccessModal';
import { conferenceAppRoot, withCallProviders } from '../../storyFixtures';
import { buildChatAccess } from '../../testFixtures';

/**
 * Both ways out of "some members can't see the chat" give something away, so neither is applied on the user's
 * behalf: the consequences are spelled out beside each action and the modal can be dismissed.
 *
 * Which one *leads* is the privacy call worth reviewing here. Exposing a private room's history is the bigger
 * step, so private rooms and DMs lead with the discussion and public rooms — already open — lead with the
 * invite. The leading action sits last, where the primary button is expected.
 */
const meta = {
	component: ChatAccessModal,
	parameters: { layout: 'centered' },
	args: {
		callId: 'call-1',
		onClose: action('onClose'),
	},
	decorators: [
		withCallProviders(conferenceAppRoot().withEndpoint('POST', '/v1/video-conference.share-chat', () => ({ success: true }) as any)),
	],
} satisfies Meta<typeof ChatAccessModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A public channel: its history is already open, so "Add to room" leads. */
export const InviteLed: Story = {
	args: { access: buildChatAccess({ name: 'general', type: 'c', membersWithoutAccess: ['grace', 'alan'] }) },
};

/** A private group: giving away its whole history is the bigger step, so the discussion leads instead. */
export const DiscussionLed: Story = {
	args: { access: buildChatAccess({ name: 'leadership', type: 'p', membersWithoutAccess: ['grace'] }) },
};

/**
 * A room that can't take new members at all — a DM. The invite isn't offered, leaving the discussion as the
 * only way to share the chat.
 */
export const DirectMessage: Story = {
	args: { access: buildChatAccess({ name: 'ada', type: 'd', canInvite: false, membersWithoutAccess: ['grace'] }) },
};

/** Several people at once, which is what the list in the body is for. */
export const SeveralMembers: Story = {
	args: {
		access: buildChatAccess({ name: 'general', type: 'c', membersWithoutAccess: ['grace', 'alan', 'katherine', 'margaret'] }),
	},
};
