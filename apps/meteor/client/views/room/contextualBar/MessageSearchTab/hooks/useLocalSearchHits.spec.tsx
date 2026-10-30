import type { IMessage } from '@rocket.chat/core-typings';
import type { E2EESearchHit } from '@rocket.chat/desktop-api';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useLocalSearchHits } from './useLocalSearchHits';
import { setMessageJumpQueryStringParameter } from '../../../../../lib/utils/setMessageJumpQueryStringParameter';

let mockMessages = new Map<string, Pick<IMessage, 'u'>>();
const mockGoToThread = jest.fn();
jest.mock('../../../hooks/useGoToThread', () => ({ useGoToThread: () => mockGoToThread }));
jest.mock('../../../../../lib/utils/setMessageJumpQueryStringParameter', () => ({ setMessageJumpQueryStringParameter: jest.fn() }));
jest.mock('../../../../../stores', () => ({
	Messages: { use: (selector: (state: { records: typeof mockMessages }) => unknown) => selector({ records: mockMessages }) },
}));

const hit: E2EESearchHit = { id: 'message', rid: 'room', uid: 'alice', username: 'alice', ts: 1, snippet: 'needle' };
afterEach(() => {
	mockMessages = new Map();
	jest.clearAllMocks();
});

it('uses the locally loaded real name when the setting is on', () => {
	mockMessages.set(hit.id, { u: { _id: hit.uid, username: 'alice-new', name: 'Alice Doe' } });
	const { result, rerender } = renderHook(() => useLocalSearchHits([hit]), {
		wrapper: mockAppRoot().withSetting('UI_Use_Real_Name', true).build(),
	});
	expect(result.current.hits[0]).toMatchObject({ username: 'alice-new', displayName: 'Alice Doe' });
	mockMessages = new Map();
	rerender();
	expect(result.current.hits[0]).toMatchObject({ username: 'alice', displayName: 'alice' });
});

it('keeps the username when the real-name setting is off', () => {
	mockMessages.set(hit.id, { u: { _id: hit.uid, username: 'alice-new', name: 'Alice Doe' } });
	const { result } = renderHook(() => useLocalSearchHits([hit]), {
		wrapper: mockAppRoot().withSetting('UI_Use_Real_Name', false).build(),
	});
	expect(result.current.hits[0].displayName).toBe('alice-new');
});

it('jumps to the message for a room hit', () => {
	const { result } = renderHook(() => useLocalSearchHits([hit]), { wrapper: mockAppRoot().build() });
	act(() => result.current.onOpenHit(result.current.hits[0]));
	expect(setMessageJumpQueryStringParameter).toHaveBeenCalledWith('message');
	expect(mockGoToThread).not.toHaveBeenCalled();
});

it('opens the thread and its reply for a thread hit', () => {
	const { result } = renderHook(() => useLocalSearchHits([{ ...hit, tmid: 'thread' }]), { wrapper: mockAppRoot().build() });
	act(() => result.current.onOpenHit(result.current.hits[0]));
	expect(mockGoToThread).toHaveBeenCalledWith({ rid: 'room', tmid: 'thread', msg: 'message' });
	expect(setMessageJumpQueryStringParameter).not.toHaveBeenCalled();
});
