import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import CallMemberItem from './CallMemberItem';
import { conferenceAppRoot, members, withCallProviders } from '../../storyFixtures';

/**
 * One member of a call, labelled with where they stand with it.
 *
 * The membership record accumulates rather than replaces — `joined` never goes back to false, and a decline
 * stays recorded after someone changes their mind — so these stories are the states that reading it in the
 * right order produces.
 */
const meta = {
	component: CallMemberItem,
	parameters: { layout: 'centered' },
	args: {
		hasChatAccess: true,
		onRing: action('onRing'),
	},
	decorators: [
		(Story) => (
			<Box width='x320' backgroundColor='surface-light' borderRadius='x4'>
				<Story />
			</Box>
		),
		withCallProviders(conferenceAppRoot()),
	],
} satisfies Meta<typeof CallMemberItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** In the call. Nothing to say about them, and nothing to ring — they are already here. */
export const Joined: Story = {
	args: { member: members.joined },
};

/** Their phone is ringing now. No ring button while it is: there is nothing to ask for. */
export const Ringing: Story = {
	args: { member: members.ringing },
};

/** They turned it down. Ringing them back is exactly the point, so the button is offered. */
export const Declined: Story = {
	args: { member: members.declined },
};

/** They were here and left. That beats an earlier decline, because they did answer. */
export const Left: Story = {
	args: { member: members.left },
};

/** Invited and never rung — waiting for an answer nobody has been asked for yet. */
export const Invited: Story = {
	args: { member: { _id: 'invited', username: 'linus', name: 'Linus Torvalds', joined: false } },
};

/**
 * In the call but unable to read its chat — being added to a conference grants no room access. Marked with a
 * struck-through balloon rather than being hidden, since it is the thing someone can act on.
 */
export const WithoutChatAccess: Story = {
	args: { member: members.joined, hasChatAccess: false },
};

/** With real names on, the username is kept alongside rather than replaced. */
export const ShowingBothNames: Story = {
	args: { member: members.joined },
	decorators: [withCallProviders(conferenceAppRoot().withSetting('UI_Use_Real_Name', true))],
};
