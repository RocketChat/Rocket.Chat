import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useMessages } from './useMessages';
import FakeRoomProvider from '../../../../../tests/mocks/client/FakeRoomProvider';
import { createFakeMessage } from '../../../../../tests/mocks/data';
import { Messages } from '../../../../stores';

const roomOverrides = { _id: 'room-id', t: 'c' as const, sysMes: ['ujt' as const] };
const at = (minutes: number) => new Date(Date.UTC(2026, 0, 1, 12, minutes));
const message = (_id: string, minutes: number, overrides = {}) => createFakeMessage({ _id, rid: 'room-id', ts: at(minutes), ...overrides });

const renderMessages = (preferences: { showThreadsInMainChannel?: boolean } = {}) =>
	renderHook(() => useMessages({ rid: 'room-id' }), {
		wrapper: mockAppRoot()
			.withSetting('Hide_System_Messages', ['uj'])
			.withUserPreference('showThreadsInMainChannel', preferences.showThreadsInMainChannel ?? false)
			.wrap((children: ReactNode) => <FakeRoomProvider roomOverrides={roomOverrides}>{children}</FakeRoomProvider>)
			.build(),
	});

beforeEach(() => {
	Messages.state.replaceAll([
		message('late', 5),
		message('early', 1),
		message('hidden', 2, { _hidden: true }),
		message('hidden-by-setting', 3, { t: 'uj' }),
		message('hidden-by-room', 3, { t: 'ujt' }),
		message('system-shown', 4, { t: 'au' }),
		message('thread-reply', 6, { tmid: 'early' }),
		message('thread-reply-in-room', 7, { tmid: 'early', tshow: true }),
		createFakeMessage({ _id: 'other-room', rid: 'another-room', ts: at(0) }),
	]);
});

afterEach(() => Messages.state.replaceAll([]));

it('lists the visible messages of the room, oldest first (R8)', () => {
	const { result } = renderMessages();

	expect(result.current.map(({ _id }) => _id)).toEqual(['early', 'system-shown', 'late', 'thread-reply-in-room']);
});

it('lists the thread replies too when the viewer shows threads in the main channel (R8)', () => {
	const { result } = renderMessages({ showThreadsInMainChannel: true });

	expect(result.current.map(({ _id }) => _id)).toEqual(['early', 'system-shown', 'late', 'thread-reply', 'thread-reply-in-room']);
});
