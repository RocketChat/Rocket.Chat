import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from 'storybook/test';

import ConferenceWindow from './ConferenceWindow';
import ConferenceChatNotShared from '../components/ConferenceChatNotShared';
import type { ConferenceMember } from '../context/definitions';
import { conferenceAppRoot, onPhone, withConferenceWindow, withLiveConference } from '../fixtures/storyFixtures';
import { buildChatAccess, buildConferenceMember } from '../fixtures/testFixtures';

/**
 * The assembled ongoing call — the thing all the other stories are parts of: the top bar with the call's name
 * and its timer, the call itself, the bar's actions, and a panel docked beside it.
 *
 * This is the real window, not a mock-up of it. What makes that possible without a live conference is that the
 * window is *told* about the call rather than fetching it: a joined session with a URL is a value, so a story
 * can state one. The provider's page is `about:blank` — the iframe is real, but no third-party URL is loaded.
 *
 * The call's chat is the one part the window does not build: it is the product's room, handed in as a node. So
 * these stories open the members panel, except the one that is about a chat there is nothing to show for.
 */

const CALL_STARTED_MS_AGO = 8 * 60 * 1000 + 12 * 1000;

const viewer = buildConferenceMember({ _id: 'john.doe', username: 'john.doe', name: 'John Doe' });

const inCall = (
	members: ConferenceMember[],
	{ membersWithoutAccess = [] as string[], chat }: { membersWithoutAccess?: string[]; chat?: React.ReactNode } = {},
) =>
	withLiveConference({
		call: {
			members,
			name: 'Weekly sync',
			createdAt: new Date(Date.now() - CALL_STARTED_MS_AGO),
			canRename: true,
			capabilities: { mic: true, cam: true, title: true },
		},
		room: {
			rid: 'room-id',
			name: 'general',
			type: 'c',
			loading: false,
			chatAccess: membersWithoutAccess.length ? buildChatAccess({ membersWithoutAccess }) : undefined,
		},
		session: { joined: true, url: 'about:blank' },
		slots: { chat },
	});

// Ringing someone back from the members panel is offered only to a caller the workspace lets ring.
const appRoot = () => conferenceAppRoot().withPermission('videoconf-ring-users');

/** Opens the members panel, which is where the window shows who is in the call. */
const openMembers = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
	const canvas = within(canvasElement);

	await userEvent.click(await canvas.findByRole('button', { name: /in the call/i }));
};

/** Opens the chat panel, which shows whatever node the story handed the window. */
const openChat = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
	const canvas = within(canvasElement);

	await userEvent.click(await canvas.findByRole('button', { name: /^Chat/i }));
};

const meta = {
	component: ConferenceWindow,
	parameters: { layout: 'fullscreen' },
	decorators: [
		// `100dvh` and no minimum: a floor propped the window up to a height the phone stories don't have, which
		// is the very thing they exist to show. Desktop stories are unaffected — their viewport was always taller.
		(Story) => (
			<div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
				<Story />
			</div>
		),
		withConferenceWindow(appRoot()),
	],
} satisfies Meta<typeof ConferenceWindow>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Alone in the call, with the members panel open beside it — the call just started and nobody else has arrived.
 */
export const AloneInTheCall: Story = {
	decorators: [inCall([viewer])],
	play: openMembers,
};

/**
 * A call in progress: several people in it, one still ringing, and one who turned it down — each labelled, with
 * a way to ring back the ones who aren't here.
 */
export const SeveralParticipants: Story = {
	decorators: [
		inCall([
			viewer,
			buildConferenceMember({ _id: 'ada', username: 'ada', name: 'Ada Lovelace' }),
			buildConferenceMember({ _id: 'grace', username: 'grace', name: 'Grace Hopper' }),
			buildConferenceMember({ _id: 'katherine', username: 'katherine', name: 'Katherine Johnson', joined: false, ringingAt: new Date() }),
			buildConferenceMember({ _id: 'alan', username: 'alan', name: 'Alan Turing', joined: false, declined: true, declinedAt: new Date() }),
		]),
	],
	play: openMembers,
};

/**
 * The same call where somebody in it can't read the chat: the notice sits above the top bar, and the member it
 * is about is marked in the panel.
 */
export const WithChatAccessNotice: Story = {
	decorators: [
		inCall(
			[
				viewer,
				buildConferenceMember({ _id: 'ada', username: 'ada', name: 'Ada Lovelace' }),
				buildConferenceMember({ _id: 'grace', username: 'grace', name: 'Grace Hopper' }),
			],
			{ membersWithoutAccess: ['grace'] },
		),
	],
	play: openMembers,
};

/**
 * The call with every panel shut — the chrome on its own, which is what a participant looking at the call sees.
 */
export const PanelsClosed: Story = {
	decorators: [inCall([viewer, buildConferenceMember({ _id: 'ada', username: 'ada', name: 'Ada Lovelace' })])],
};

/**
 * The chat panel for someone who was added to the *call* and not to its room: membership grants no room access,
 * so what the panel can offer is an explanation rather than the conversation.
 */
export const ChatNotSharedWithYou: Story = {
	decorators: [
		inCall([viewer, buildConferenceMember({ _id: 'ada', username: 'ada', name: 'Ada Lovelace' })], {
			membersWithoutAccess: ['john.doe'],
			chat: <ConferenceChatNotShared />,
		}),
	],
	play: openChat,
};

/**
 * The call window on a phone held upright, with the people panel open.
 *
 * The panel is a **sheet**: it rises over the whole window instead of docking beside the call, because splitting
 * a 393px screen left the call a sliver and the panel too narrow to use. Look for the call showing through above
 * it and down both sides — the sheet is inset, which is what says it is laid over the call rather than being the
 * window's new contents.
 */
export const MobilePortraitPanelSheet: Story = {
	...onPhone('phonePortrait'),
	decorators: [inCall([viewer, buildConferenceMember({ _id: 'ada', username: 'ada', name: 'Ada Lovelace' })])],
	play: openMembers,
};

/**
 * The same sheet on a phone turned sideways. 852px is past `md`, but the sheet is chosen on the window being
 * too small to split in *either* direction, so it appears here too.
 */
export const MobileLandscapePanelSheet: Story = {
	...onPhone('phoneLandscape'),
	decorators: [inCall([viewer, buildConferenceMember({ _id: 'ada', username: 'ada', name: 'Ada Lovelace' })])],
	play: openMembers,
};

/**
 * Landscape with every panel shut — the call chrome alone on a short screen: the top bar with the timer, name,
 * member count and chat toggle, the call filling what is left, and the provider's own controls along the bottom.
 */
export const MobileLandscapePanelsClosed: Story = {
	...onPhone('phoneLandscape'),
	decorators: [inCall([viewer, buildConferenceMember({ _id: 'ada', username: 'ada', name: 'Ada Lovelace' })])],
};
