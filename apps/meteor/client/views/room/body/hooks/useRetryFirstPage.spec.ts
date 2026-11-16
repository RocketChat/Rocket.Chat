import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useRetryFirstPage } from './useRetryFirstPage';
import { RoomHistoryManager } from '../../../../lib/RoomHistoryManager';

jest.mock('../../../../lib/SDKClient', () => ({ sdk: { rest: { get: jest.fn() } } }));
jest.mock('../../../../lib/onClientMessageReceived', () => ({ onClientMessageReceived: jest.fn((message) => message) }));
jest.mock('../../../../lib/toast', () => ({ dispatchToastMessage: jest.fn() }));

const rid = 'room-id';
const getMore = jest.spyOn(RoomHistoryManager, 'getMore');

const retry = (search: Record<string, string> = {}, canPreview = true) =>
	renderHook(() => useRetryFirstPage(rid, canPreview), {
		wrapper: mockAppRoot()
			.withRouter({ getSearchParameters: () => search })
			.build(),
	}).result.current;

beforeEach(() => {
	getMore.mockResolvedValue(undefined);
	RoomHistoryManager.close(rid);
});

afterEach(() => jest.clearAllMocks());

it('asks for the first page again only while nothing is loaded and older messages remain (R59)', () => {
	retry()();
	expect(getMore).toHaveBeenCalledTimes(1);
	expect(getMore).toHaveBeenCalledWith(rid);

	getMore.mockClear();
	RoomHistoryManager.updateRoom(rid, { isLoading: true });
	retry()();
	RoomHistoryManager.updateRoom(rid, { isLoading: false, hasMore: false });
	retry()();
	RoomHistoryManager.updateRoom(rid, { hasMore: true, loaded: 0 });
	retry()();
	expect(getMore).not.toHaveBeenCalled();
});

it('asks nothing of a room the viewer cannot preview, where every input would meet a refusal (R59)', () => {
	retry({}, false)();

	expect(getMore).not.toHaveBeenCalled();
});

it('leaves a room that is jumping to a message to that jump (R59)', () => {
	retry({ msg: 'message-id' })();

	expect(getMore).not.toHaveBeenCalled();
});

it('survives the page failing again (R59)', async () => {
	getMore.mockRejectedValue(new Error('rooms.history failed'));

	expect(() => retry()()).not.toThrow();
	await Promise.resolve();
});
