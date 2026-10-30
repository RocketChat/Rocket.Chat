import type { IMessage, IMessageSearchProvider, IUser } from '@rocket.chat/core-typings';
import type { ServerMethodName, ServerMethodParameters, ServerMethodReturn } from '@rocket.chat/ddp-client';
import type { E2EESearchDoc, ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { ServerContextValue } from '@rocket.chat/ui-contexts';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MessageSearchTab from './MessageSearchTab';
import { createTestSearchBackend } from './verification/testSearchBackend';
import type { SearchIndexProgress } from '../../../../lib/e2eeSearch/searchIndexScheduler';
import { toSearchDoc } from '../../../../lib/e2eeSearch/toSearchDoc';

let mockBackend: ISearchIndexBackend | undefined;
let mockProgress: SearchIndexProgress | undefined;
let mockEncryptedAtRest: boolean | undefined;
let mockIndexExpected = false;
let mockCapabilities = true;
let mockStatus = 'idle';
const mockRoomCatchUp = jest.fn();
const mockIndexVersion = {
	value: 0,
	listeners: new Set<() => void>(),
	bump() {
		this.value++;
		this.listeners.forEach((listener) => listener());
	},
};

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
	...jest.requireActual('./hooks/useLocalSearchIndexBackend'),
	useLocalSearchIndexBackend: () => mockBackend,
	useLocalSearchIndexStatus: () => (mockBackend ? 'ready' : mockStatus),
	useLocalSearchIndexOpenResult: () =>
		mockBackend && {
			schemaVersion: 1,
			encryptedAtRest: mockEncryptedAtRest,
			...(mockCapabilities && { capabilities: { recentCursor: 1, lifecycleEvents: 1, close: 1 } }),
		},
}));

jest.mock('../../../../lib/e2ee/rocketchat.e2e', () => ({ e2eSearchIndexSession: {} }));

jest.mock('./hooks/useLocalSearchIndexProgress', () => ({
	useLocalSearchIndexProgress: () => mockProgress,
}));

jest.mock('./hooks/useLocalSearchIndexChanges', () => ({
	useLocalSearchIndexVersion: () =>
		jest.requireActual<typeof import('react')>('react').useSyncExternalStore(
			(listener: () => void) => {
				mockIndexVersion.listeners.add(listener);
				return () => mockIndexVersion.listeners.delete(listener);
			},
			() => mockIndexVersion.value,
		),
	useLocalSearchIndexRoomCatchUp: (rid: string, enabled: boolean) => mockRoomCatchUp(rid, enabled),
}));

jest.mock('./hooks/useLocalSearchIndexExpected', () => ({
	useLocalSearchIndexExpected: () => mockIndexExpected,
}));

jest.mock('../../contexts/RoomContext', () => ({
	useRoom: () => ({ _id: 'r1', t: 'p', name: 'secret', encrypted: true }),
	useRoomSubscription: () => undefined,
}));

jest.mock('../../../../stores', () => ({
	Users: { state: { find: () => undefined } },
	Messages: {
		state: { find: () => undefined },
		use: (selector: (state: { records: Map<string, IMessage> }) => unknown) => selector({ records: new Map() }),
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

const self = { _id: 'u-self', username: 'jean', utcOffset: -3 } as IUser;

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
				E2E_Local_Search_Indexing_Progress_one: 'Indexing encrypted history: {{done}} of {{count}} room',
				E2E_Local_Search_Indexing_Progress_other: 'Indexing encrypted history: {{done}} of {{count}} rooms',
				E2E_Local_Search_Memory_Only: 'On this device, the app keeps the search index in memory only and builds it again after a restart.',
			})
			.build(),
	});

const progress = (status: SearchIndexProgress['status'], roomsDone: number, rooms = 40): SearchIndexProgress => ({
	status,
	rooms,
	roomsDone,
	roomsSkipped: 0,
	indexed: 300,
	pendingDecrypt: 0,
});

describe('MessageSearchTab local search', () => {
	beforeEach(async () => {
		const backend = createTestSearchBackend();
		await backend.open({ userId: self._id });
		await backend.upsert([
			message('old', 'u-self', new Date(2024, 11, 30), 'old note'),
			message('other', 'u-bob', new Date(2025, 3, 1), 'from bob'),
			message('mine1', 'u-self', new Date(2025, 4, 1), 'first <note>'),
			message('mine2', 'u-self', new Date(2025, 5, 1), 'second note'),
		]);
		jest.spyOn(backend, 'searchRecentPage');
		mockBackend = backend;
	});

	afterEach(() => {
		mockBackend = undefined;
		mockProgress = undefined;
		mockEncryptedAtRest = undefined;
		jest.restoreAllMocks();
	});

	it('sends a text with only filters to the local index and shows the hits, newest first', async () => {
		renderTab();

		await userEvent.type(screen.getByRole('textbox', { name: 'Search_Messages' }), 'from:me after:01-01-2025');

		const hits = await screen.findAllByRole('button', { name: /note/ });
		expect(hits.map((hit) => hit.textContent)).toEqual([expect.stringContaining('second note'), expect.stringContaining('first <note>')]);
		expect(screen.queryByText('old note')).not.toBeInTheDocument();
		expect(screen.queryByText('from bob')).not.toBeInTheDocument();
		expect(mockBackend?.searchRecentPage).toHaveBeenLastCalledWith({
			text: '',
			rid: 'r1',
			limit: 10,
			uid: 'u-self',
			from: Date.UTC(2025, 0, 2) + 3 * 60 * 60 * 1000,
		});
	});

	it('loads more hits as the list reaches its end, also past the first page of the setting PageSize', async () => {
		await mockBackend?.upsert(
			Array.from({ length: 25 }, (_, i) => message(`page${i}`, 'u-bob', new Date(2026, 0, 1, 12, i), `paged ${i}`)),
		);
		renderTab();

		await userEvent.type(screen.getByRole('textbox', { name: 'Search_Messages' }), 'paged');

		await waitFor(() => expect(screen.getAllByRole('button', { name: /paged/ })).toHaveLength(25), { timeout: 5000 });
	});

	it('runs the search again when the index changes, so a hit that the indexing adds later shows', async () => {
		renderTab();
		await userEvent.type(screen.getByRole('textbox', { name: 'Search_Messages' }), 'later');
		expect(await screen.findByRole('heading', { name: 'No_results_found' })).toBeInTheDocument();

		await mockBackend?.upsert([message('late', 'u-bob', new Date(2026, 0, 2), 'indexed later')]);
		act(() => mockIndexVersion.bump());

		expect(await screen.findByRole('button', { name: /indexed later/ })).toBeInTheDocument();
	});

	it('shows visible feedback when a local query rejects and recovers on the next query', async () => {
		const recent = jest.spyOn(mockBackend!, 'searchRecentPage').mockRejectedValue(new Error('local query failed'));
		const serverSearch = jest.fn(() => ({ message: { docs: [] } }));
		render(<MessageSearchTab />, {
			wrapper: mockAppRoot().withUser(self).withSetting('PageSize', 10).withMethod('rocketchatSearch.search', serverSearch).build(),
		});
		const input = screen.getByRole('textbox', { name: 'Search_Messages' });
		await userEvent.type(input, 'note');
		expect(await screen.findByRole('alert', {}, { timeout: 10000 })).toHaveTextContent('Search_message_search_failed');
		expect(document.querySelector('.rcx-throbber__circle')).toBeNull();
		expect(serverSearch).not.toHaveBeenCalled();
		recent.mockRestore();
		await userEvent.clear(input);
		await userEvent.type(input, 'no matching message');
		expect(await screen.findByRole('heading', { name: 'No_results_found' })).toBeInTheDocument();
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		expect(serverSearch).not.toHaveBeenCalled();
	});

	it('asks for a catch-up of the room while its local search is open', async () => {
		mockRoomCatchUp.mockClear();
		renderTab();

		expect(await screen.findByRole('textbox', { name: 'Search_Messages' })).toBeInTheDocument();
		expect(mockRoomCatchUp).toHaveBeenCalledWith('r1', true);
	});

	it('does not search the local index for an empty text', async () => {
		renderTab();

		await userEvent.type(screen.getByRole('textbox', { name: 'Search_Messages' }), '   ');

		await new Promise((resolve) => setTimeout(resolve, 400));
		expect(mockBackend?.searchRecentPage).not.toHaveBeenCalled();
		expect(screen.queryByRole('button', { name: /note/ })).not.toBeInTheDocument();
	});

	it.each(['indexing', 'backing-off'] as const)('shows the indexing progress while the history is not complete (%s)', async (status) => {
		mockProgress = progress(status, 12);
		renderTab();

		expect(await screen.findByText('Indexing encrypted history: 12 of 40 rooms')).toBeInTheDocument();
	});

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

	it('shows a note when the index is kept in memory only (encryptedAtRest false)', async () => {
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
		const backend = createTestSearchBackend();
		await backend.open({ userId: self._id });
		const doc = toSearchDoc(fileMessage);
		await backend.upsert(doc ? [doc] : []);
		mockBackend = backend;
	});

	afterEach(() => {
		mockBackend = undefined;
	});

	it('shows the caption of a file message in a filter-only hit, not only the file name', async () => {
		renderTab();

		await userEvent.type(screen.getByRole('textbox', { name: 'Search_Messages' }), 'from:me');

		const [hit] = await screen.findAllByRole('button', { name: /budget|Screenshot/ });
		expect(hit).toHaveTextContent('budget numbers for the board');
	});

	it('shows the matched caption of a file message', async () => {
		renderTab();

		await userEvent.type(screen.getByRole('textbox', { name: 'Search_Messages' }), 'board');

		const [hit] = await screen.findAllByRole('button', { name: /board/ });
		expect(within(hit).getByText('board', { selector: 'mark' })).toBeInTheDocument();
		expect(hit).toHaveTextContent('budget numbers for the board');
	});
});

describe('MessageSearchTab while the local index of this device is not open yet', () => {
	beforeEach(() => {
		mockBackend = undefined;
		mockIndexExpected = true;
		mockStatus = 'opening';
	});

	afterEach(() => {
		mockIndexExpected = false;
		mockStatus = 'idle';
	});

	it('sends no search of the encrypted room to the server', async () => {
		mockBackend = undefined;
		mockIndexExpected = true;
		const serverSearch = jest.fn(() => ({ message: { docs: [] } }));
		render(<MessageSearchTab />, {
			wrapper: mockAppRoot().withUser(self).withSetting('PageSize', 10).withMethod('rocketchatSearch.search', serverSearch).build(),
		});

		await userEvent.type(screen.getByRole('textbox', { name: 'Search_Messages' }), 'secret words');
		await new Promise((resolve) => setTimeout(resolve, 400));

		expect(serverSearch).not.toHaveBeenCalled();
		expect(screen.queryByText('Encrypted_content_cannot_be_searched')).not.toBeInTheDocument();
	});

	it.each(['locked', 'unavailable', 'idle'])('shows %s feedback without loading or server search', async (status) => {
		mockStatus = status;
		const serverSearch = jest.fn(() => ({ message: { docs: [] } }));
		render(<MessageSearchTab />, {
			wrapper: mockAppRoot().withUser(self).withSetting('PageSize', 10).withMethod('rocketchatSearch.search', serverSearch).build(),
		});
		await userEvent.type(screen.getByRole('textbox', { name: 'Search_Messages' }), 'secret words');
		await new Promise((resolve) => setTimeout(resolve, 400));
		expect(
			screen
				.getAllByRole('status')
				.some((region) => region.textContent?.includes(status === 'locked' ? 'E2E_Local_Search_Locked' : 'E2E_Local_Search_Unavailable')),
		).toBe(true);
		expect(document.querySelector('.rcx-throbber__circle')).toBeNull();
		expect(serverSearch).not.toHaveBeenCalled();
		expect(screen.queryByText('Encrypted_content_cannot_be_searched')).not.toBeInTheDocument();
	});

	it('shows the loading state for a text, and none for a text of only spaces', async () => {
		mockBackend = undefined;
		mockIndexExpected = true;
		renderTab();
		const input = screen.getByRole('textbox', { name: 'Search_Messages' });

		await userEvent.type(input, '   ');
		await new Promise((resolve) => setTimeout(resolve, 400));
		expect(document.querySelector('.rcx-throbber__circle')).toBeNull();

		await userEvent.type(input, 'secret');
		await waitFor(() => expect(document.querySelector('.rcx-throbber__circle')).not.toBeNull());
	});
});

describe('MessageSearchTab without a local search backend', () => {
	it('preserves legacy search when the desktop open result has no B1 capabilities', async () => {
		mockBackend = createTestSearchBackend();
		const recent = jest.spyOn(mockBackend, 'searchRecentPage');
		mockCapabilities = false;
		const transport = jest.fn();
		const callMethod: NonNullable<ServerContextValue['callMethod']> = async <MethodName extends ServerMethodName>(
			method: MethodName,
			...args: ServerMethodParameters<MethodName>
		): Promise<ServerMethodReturn<MethodName>> => {
			transport(method, ...args);
			if (method !== 'rocketchatSearch.search') throw new Error(`Unexpected method: ${method}`);
			return { message: { docs: [] } } as ServerMethodReturn<MethodName>;
		};
		try {
			render(<MessageSearchTab />, {
				wrapper: mockAppRoot().withUser(self).withSetting('PageSize', 10).withServerContext({ callMethod }).build(),
			});
			await userEvent.type(screen.getByRole('textbox', { name: 'Search_Messages' }), 'legacy');
			await waitFor(() =>
				expect(transport).toHaveBeenCalledWith(
					'rocketchatSearch.search',
					'legacy',
					{ uid: 'u-self', rid: 'r1' },
					{ limit: 10, searchAll: false },
				),
			);
			expect(recent).not.toHaveBeenCalled();
		} finally {
			mockCapabilities = true;
			mockBackend = undefined;
		}
	});

	it('shows the callout of today and no state of the local index', async () => {
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
