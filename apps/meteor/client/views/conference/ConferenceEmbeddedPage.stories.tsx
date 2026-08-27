import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient } from '@tanstack/react-query';
import { userEvent, within } from 'storybook/test';

import ConferenceEmbeddedPage from './ConferenceEmbeddedPage';
import { conferenceAppRoot, withCallProviders } from './storyFixtures';
import { videoConferenceQueryKeys } from '../../lib/queryKeys';

/**
 * The assembled ongoing call — the thing all the other stories are parts of: the top bar with the call's name
 * and its timer, the call itself, the bar's actions, and a panel docked beside it.
 *
 * This is the real `ConferenceEmbeddedPage`, not a mock-up of it. Two things make that possible without a live
 * conference:
 *
 * - **Joining is a cache entry.** `useConferenceEmbedded` reads whether this window has joined from a *disabled*
 *   query, so seeding that key is exactly what a window which has already joined would find there. That is what
 *   puts the page past the preflight and into the call.
 * - **The chat panel stays shut.** It is the only part that needs a real room in the store; the members panel
 *   needs nothing but the conference's own membership. So these stories open the members panel, and the chat
 *   never mounts.
 *
 * The provider's page is `about:blank` — the iframe is real, but no third-party URL is loaded.
 */

const callId = 'call-id';

const CALL_STARTED_MS_AGO = 8 * 60 * 1000 + 12 * 1000;

/** `ts` is required on a membership entry and arrives as a string over REST, as in the hook's own spec. */
const member = (_id: string, name: string, overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
	_id,
	username: _id,
	name,
	ts: '2026-08-03T10:00:00.000Z',
	joined: true,
	...overrides,
});

const viewer = member('john.doe', 'John Doe');

const buildInfo = (users: Record<string, unknown>[], membersWithoutAccess: string[] = []) =>
	({
		_id: callId,
		type: 'videoconference',
		rid: 'room-id',
		title: 'Weekly sync',
		createdAt: new Date(Date.now() - CALL_STARTED_MS_AGO).toISOString(),
		createdBy: { _id: 'john.doe', username: 'john.doe', name: 'John Doe' },
		users,
		messages: { started: 'started-message-id' },
		capabilities: { mic: true, cam: true, title: true },
		chatAccess: { rid: 'room-id', name: 'general', type: 'c', membersWithoutAccess, canInvite: true },
	}) as any;

/**
 * A window that has already joined.
 *
 * The url is what the join endpoint would have answered with. A fresh `QueryClient` per story keeps one story's
 * seeded call out of the next one's cache.
 */
const joinedAppRoot = (users: Record<string, unknown>[], membersWithoutAccess: string[] = []) => {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

	queryClient.setQueryData(videoConferenceQueryKeys.join(callId), { url: 'about:blank', providerName: 'storybook' });

	return (
		conferenceAppRoot()
			.withQueryClient(queryClient)
			.withEndpoint('GET', '/v1/video-conference.info', () => buildInfo(users, membersWithoutAccess))
			.withEndpoint('POST', '/v1/video-conference.join', () => ({ url: 'about:blank', providerName: 'storybook' }) as any)
			// Renewing presence, ringing someone back, and sharing the chat all happen from this screen. Stubbed so
			// the page is fully live without reaching the network.
			.withEndpoint('POST', '/v1/video-conference.heartbeat', () => ({ success: true }) as any)
			.withEndpoint('POST', '/v1/video-conference.ring', () => ({ success: true }) as any)
			.withEndpoint('POST', '/v1/video-conference.share-chat', () => ({ success: true }) as any)
			.withEndpoint('POST', '/v1/video-conference.add-participants', () => ({ added: [], success: true }) as any)
			.withEndpoint('GET', '/v1/users.autocomplete', () => ({ items: [], success: true }) as any)
			// The unread badge on the shut chat reads the viewer's subscription. Nothing here needs one, and
			// answering `null` keeps it out of the subscriptions store.
			.withEndpoint('GET', '/v1/subscriptions.getOne', () => ({ subscription: null, success: true }) as any)
	);
};

/** Opens the members panel, which is where the page shows who is in the call. */
const openMembers = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
	const canvas = within(canvasElement);

	await userEvent.click(await canvas.findByRole('button', { name: /in the call/i }));
};

/**
 * Opens the chat panel. Only safe for a viewer who cannot read the chat: that branch renders the notice instead
 * of the room, and the room is the one part of this page that needs a live store.
 */
const openChat = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
	const canvas = within(canvasElement);

	await userEvent.click(await canvas.findByRole('button', { name: /^Chat/i }));
};

const meta = {
	component: ConferenceEmbeddedPage,
	parameters: { layout: 'fullscreen' },
	args: { callId },
	decorators: [
		(Story) => (
			<div style={{ display: 'flex', flexDirection: 'column', height: '100vh', minHeight: 560 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof ConferenceEmbeddedPage>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Alone in the call, with the members panel open beside it — the call just started and nobody else has arrived.
 */
export const AloneInTheCall: Story = {
	decorators: [withCallProviders(joinedAppRoot([viewer]))],
	play: openMembers,
};

/**
 * A call in progress: several people in it, one still ringing, and one who turned it down — each labelled, with
 * a way to ring back the ones who aren't here.
 */
export const SeveralParticipants: Story = {
	decorators: [
		withCallProviders(
			joinedAppRoot([
				viewer,
				member('ada', 'Ada Lovelace'),
				member('grace', 'Grace Hopper'),
				member('katherine', 'Katherine Johnson', { joined: false, ringingAt: new Date().toISOString() }),
				member('alan', 'Alan Turing', { joined: false, declined: true, declinedAt: new Date().toISOString() }),
			]),
		),
	],
	play: openMembers,
};

/**
 * The same call where somebody in it can't read the chat: the notice sits above the top bar, and the member it
 * is about is marked in the panel.
 */
export const WithChatAccessNotice: Story = {
	decorators: [withCallProviders(joinedAppRoot([viewer, member('ada', 'Ada Lovelace'), member('grace', 'Grace Hopper')], ['grace']))],
	play: openMembers,
};

/**
 * The call with every panel shut — the chrome on its own, which is what a participant looking at the call sees.
 */
export const PanelsClosed: Story = {
	decorators: [withCallProviders(joinedAppRoot([viewer, member('ada', 'Ada Lovelace')]))],
};

/**
 * The chat panel for someone who was added to the *call* and not to its room: membership grants no room access,
 * so what the panel can offer is an explanation rather than the conversation.
 */
export const ChatNotSharedWithYou: Story = {
	decorators: [withCallProviders(joinedAppRoot([viewer, member('ada', 'Ada Lovelace')], ['john.doe']))],
	play: openChat,
};
