import type { IMessage, IMessageSearchProvider, IUser } from '@rocket.chat/core-typings';
import type { E2EESearchDoc, ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MessageSearchTab from './MessageSearchTab';
import { createFakeSearchIndexBackend } from '../../../../lib/e2eeSearch/fakeSearchIndexBackend';
import type { SearchIndexProgress } from '../../../../lib/e2eeSearch/searchIndexScheduler';
import { toSearchDoc } from '../../../../lib/e2eeSearch/toSearchDoc';

let mockBackend: ISearchIndexBackend | undefined;
let mockProgress: SearchIndexProgress | undefined;
let mockEncryptedAtRest: boolean | undefined;

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

jest.mock('./hooks/useLocalSearchIndexProgress', () => ({
	useLocalSearchIndexProgress: () => mockProgress,
}));

jest.mock('./hooks/useLocalSearchIndexEncryptedAtRest', () => ({
	useLocalSearchIndexEncryptedAtRest: () => mockEncryptedAtRest,
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

jest.mock('../../../../lib/getRoomTypeTranslation', () => ({
	getRoomTypeTranslation: () => 'Private group',
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
		wrapper: mockAppRoot()
			.withUser(self)
			.withSetting('PageSize', 10)
			.withMethod('rocketchatSearch.search', () => ({ message: { docs: [] } }))
			.withTranslations('en', 'core', {
				Encrypted_content_cannot_be_searched: 'Encrypted content cannot be searched.',
				E2E_Local_Search_Indexing_Progress: 'Indexing encrypted history: {{done}} of {{total}} rooms',
				E2E_Local_Search_Memory_Only: 'On this device, the app keeps the search index in memory only and builds it again after a restart.',
			})
			.build(),
	});

const progress = (status: SearchIndexProgress['status'], roomsDone: number, rooms = 40): SearchIndexProgress => ({
	status,
	rooms,
	roomsDone,
	indexed: 300,
	pendingDecrypt: 0,
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
		mockProgress = undefined;
		mockEncryptedAtRest = undefined;
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

	it.each(['indexing', 'waiting-for-idle', 'backing-off'] as const)(
		'shows the indexing progress while the history is not complete (%s, LSE2EE-51)',
		async (status) => {
			mockProgress = progress(status, 12);
			renderTab();

			expect(await screen.findByText('Indexing encrypted history: 12 of 40 rooms')).toBeInTheDocument();
		},
	);

	it.each([
		['done', progress('done', 40)],
		['stopped', progress('stopped', 12)],
		['every room backfilled, catch-up running', progress('indexing', 40)],
		['no open index', undefined],
	])('shows no indexing progress when %s', async (_case, value) => {
		mockProgress = value;
		renderTab();

		expect(await screen.findByRole('textbox', { name: 'Search_Messages' })).toBeInTheDocument();
		expect(screen.queryByText(/Indexing encrypted history/)).not.toBeInTheDocument();
	});

	it('shows a note when the index is kept in memory only (encryptedAtRest false, LSE2EE-51)', async () => {
		mockEncryptedAtRest = false;
		renderTab();

		expect(await screen.findByText(/in memory only/)).toHaveTextContent(
			'On this device, the app keeps the search index in memory only and builds it again after a restart.',
		);
	});

	it.each([
		['the index is encrypted at rest', true],
		['the open result is not known', undefined],
	])('shows no memory-only note when %s', async (_case, value) => {
		mockEncryptedAtRest = value;
		renderTab();

		expect(await screen.findByRole('textbox', { name: 'Search_Messages' })).toBeInTheDocument();
		expect(screen.queryByText(/in memory only/)).not.toBeInTheDocument();
	});
});

describe('MessageSearchTab local search of file messages', () => {
	// A decrypted image upload from a mobile or older web client: the caption is the attachment description, with no message text.
	const fileName = 'Screenshot 2026-10-01 at 13.45.02 from the quarterly planning call.png';
	const fileMessage = {
		_id: 'file1',
		rid: 'r1',
		u: { _id: 'u-self', username: 'jean' },
		ts: new Date(2025, 4, 1),
		_updatedAt: new Date(2025, 4, 1),
		t: 'e2e',
		e2e: 'done',
		msg: '',
		file: { _id: 'f1', name: fileName, type: 'image/png', size: 10, format: 'png' },
		files: [{ _id: 'f1', name: fileName, type: 'image/png', size: 10, format: 'png' }],
		attachments: [
			{ type: 'file', title: fileName, description: 'budget numbers for the board', image_url: '/file-upload/f1', fileId: 'f1' },
		],
	} as unknown as IMessage;

	beforeEach(async () => {
		const backend = createFakeSearchIndexBackend();
		await backend.open({ userId: self._id });
		const doc = toSearchDoc(fileMessage);
		await backend.upsert(doc ? [doc] : []);
		mockBackend = backend;
	});

	afterEach(() => {
		mockBackend = undefined;
	});

	it('shows the caption of a file message in a filter-only hit, not only the file name (PROD-642)', async () => {
		renderTab();

		await userEvent.type(screen.getByRole('textbox', { name: 'Search_Messages' }), 'from:me');

		const [hit] = await screen.findAllByRole('button', { name: /budget|Screenshot/ });
		expect(hit).toHaveTextContent('budget numbers for the board');
	});

	it('shows the matched caption of a file message (PROD-642)', async () => {
		renderTab();

		await userEvent.type(screen.getByRole('textbox', { name: 'Search_Messages' }), 'board');

		const [hit] = await screen.findAllByRole('button', { name: /board/ });
		expect(within(hit).getByText('board', { selector: 'mark' })).toBeInTheDocument();
		expect(hit).toHaveTextContent('budget numbers for the board');
	});
});

describe('MessageSearchTab without a local search backend', () => {
	it('shows the callout of today and no state of the local index (LSE2EE-51)', async () => {
		mockBackend = undefined;
		mockProgress = progress('indexing', 12);
		mockEncryptedAtRest = false;
		renderTab();

		expect(await screen.findByText('Encrypted content cannot be searched.')).toBeInTheDocument();
		expect(screen.queryByText(/Indexing encrypted history/)).not.toBeInTheDocument();
		expect(screen.queryByText(/in memory only/)).not.toBeInTheDocument();
		mockProgress = undefined;
		mockEncryptedAtRest = undefined;
	});
});
