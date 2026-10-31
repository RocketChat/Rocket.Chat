import { mockAppRoot } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { render, screen, waitFor } from '@testing-library/react';

import { modalParser } from '../surfaces';

// Searches never return the initial selection, so the chips can only come from fetching it.
// A fresh app root per test keeps one test's cached answers from leaking into the next.
const buildWrapper = () =>
	mockAppRoot()
		.withEndpoint('GET', '/v1/users.autocomplete', () => ({ items: [{ _id: 'u1', username: 'rocket.cat', name: 'Rocket Cat' }] }) as any)
		.withEndpoint(
			'GET',
			'/v1/users.info',
			({ username }: any) => ({ user: { _id: username, username, name: `Name of ${username}` } }) as any,
		)
		.withEndpoint('GET', '/v1/rooms.autocomplete.channelAndPrivate', () => ({ items: [] }) as any)
		.withEndpoint('GET', '/v1/rooms.info', ({ roomId }: any) => ({ room: { _id: roomId, name: `room-${roomId}`, t: 'c' } }) as any)
		.withEndpoint(
			'GET',
			'/v1/subscriptions.get',
			() => ({ update: [{ rid: 'dm1', name: 'john.doe', fname: 'John Doe', t: 'd' }], remove: [] }) as any,
		)
		.build();

const ids = { appId: 'app', blockId: 'block', actionId: 'pick' };

const renderInput = (element: UiKit.InputBlock['element']) =>
	render(<>{modalParser.render([{ type: 'input', label: { type: 'plain_text', text: 'Pick' }, element }])}</>, { wrapper: buildWrapper() });

it.each([
	['users_select', { ...ids, type: 'users_select', initial_user: 'jane.roe' }, ['Name of jane.roe']],
	[
		'multi_users_select',
		{ ...ids, type: 'multi_users_select', initial_users: ['jane.roe', 'rocket.cat'] },
		['Name of jane.roe', 'Rocket Cat'],
	],
	['channels_select', { ...ids, type: 'channels_select', initial_channel: 'r1' }, ['room-r1']],
	['multi_channels_select', { ...ids, type: 'multi_channels_select', initial_channels: ['r1', 'r2'] }, ['room-r1', 'room-r2']],
	['conversations_select', { ...ids, type: 'conversations_select', initial_conversation: 'dm1' }, ['John Doe']],
	['multi_conversations_select', { ...ids, type: 'multi_conversations_select', initial_conversations: ['dm1'] }, ['John Doe']],
] as [string, UiKit.InputBlock['element'], string[]][])('shows the initial selection of a %s', async (_type, element, labels) => {
	renderInput(element);

	// The select remounts once the selection's labels load, so wait for the final mount rather than the first match.
	await waitFor(() => labels.forEach((label) => expect(screen.getByText(label)).toBeInTheDocument()));
});
