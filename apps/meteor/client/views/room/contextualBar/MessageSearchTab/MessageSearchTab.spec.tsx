import type { IMessageSearchProvider, IUser } from '@rocket.chat/core-typings';
import type { E2EESearchDoc, ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MessageSearchTab from './MessageSearchTab';
import { createFakeSearchIndexBackend } from '../../../../lib/e2eeSearch/fakeSearchIndexBackend';

let mockBackend: ISearchIndexBackend | undefined;

const provider: IMessageSearchProvider = {
	key: 'defaultProvider',
	i18nLabel: 'Default_provider',
	description: '',
	supportsSuggestions: false,
	settings: { GlobalSearchEnabled: false },
} as unknown as IMessageSearchProvider;

jest.mock('./hooks/useMessageSearchProviderQuery', () => ({
	useMessageSearchProviderQuery: () => ({ data: provider, isSuccess: true, isError: false }),
}));

jest.mock('./hooks/useLocalSearchIndexBackend', () => ({
	useLocalSearchIndexBackend: () => mockBackend,
}));

jest.mock('../../contexts/RoomContext', () => ({
	useRoom: () => ({ _id: 'r1', t: 'p', name: 'secret', encrypted: true }),
	useRoomSubscription: () => undefined,
}));

jest.mock('../../../../stores', () => ({
	Users: { state: { find: () => undefined } },
	Messages: {
		state: { find: () => undefined },
		use: (selector: (state: { get: (id: string) => unknown }) => unknown) => selector({ get: () => undefined }),
	},
}));

jest.mock('../../../../lib/utils/setMessageJumpQueryStringParameter', () => ({
	setMessageJumpQueryStringParameter: jest.fn(),
}));

// The server search list, which a local search does not render.
jest.mock('../../MessageList/providers/MessageListProvider', () => () => null);
jest.mock('../../MessageList/MessageListErrorBoundary', () => () => null);
jest.mock('../../../../components/message/variants/RoomMessage', () => () => null);
jest.mock('../../../../components/message/variants/SystemMessage', () => () => null);

const self = { _id: 'u-self', username: 'jean' } as IUser;

const message = (id: string, uid: string, date: Date, body: string): E2EESearchDoc => ({
	id,
	rid: 'r1',
	uid,
	username: uid === self._id ? 'jean' : 'bob',
	ts: date.getTime(),
	updatedAt: 1,
	kind: 'text',
	body,
});

const renderTab = () =>
	render(<MessageSearchTab />, {
		wrapper: mockAppRoot().withUser(self).withSetting('PageSize', 10).build(),
	});

describe('MessageSearchTab local search', () => {
	beforeEach(async () => {
		const backend = createFakeSearchIndexBackend();
		await backend.open({ userId: self._id });
		await backend.upsert([
			message('old', 'u-self', new Date(2024, 11, 30), 'old note'),
			message('other', 'u-bob', new Date(2025, 3, 1), 'from bob'),
			message('mine1', 'u-self', new Date(2025, 4, 1), 'first <note>'),
			message('mine2', 'u-self', new Date(2025, 5, 1), 'second note'),
		]);
		jest.spyOn(backend, 'search');
		mockBackend = backend;
	});

	afterEach(() => {
		mockBackend = undefined;
		jest.restoreAllMocks();
	});

	it('sends a text with only filters to the local index and shows the hits, newest first (LSE2EE-74)', async () => {
		renderTab();

		await userEvent.type(screen.getByRole('textbox', { name: 'Search_Messages' }), 'from:me after:01-01-2025');

		const hits = await screen.findAllByRole('button', { name: /note/ });
		expect(hits.map((hit) => hit.textContent)).toEqual([expect.stringContaining('second note'), expect.stringContaining('first <note>')]);
		expect(screen.queryByText('old note')).not.toBeInTheDocument();
		expect(screen.queryByText('from bob')).not.toBeInTheDocument();
		expect(mockBackend?.search).toHaveBeenLastCalledWith({
			text: '',
			rid: 'r1',
			order: 'recent',
			limit: 10,
			uid: 'u-self',
			from: new Date(2025, 0, 2).getTime(),
		});
	});

	it('does not search the local index for an empty text', async () => {
		renderTab();

		await userEvent.type(screen.getByRole('textbox', { name: 'Search_Messages' }), '   ');

		await new Promise((resolve) => setTimeout(resolve, 400));
		expect(mockBackend?.search).not.toHaveBeenCalled();
		expect(screen.queryByRole('button', { name: /note/ })).not.toBeInTheDocument();
	});
});
