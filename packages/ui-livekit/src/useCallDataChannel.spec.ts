import { act, renderHook } from '@testing-library/react';
import type { LocalParticipant, Room } from 'livekit-client';
import { RoomEvent } from 'livekit-client';

import type { CallConnection, CallSFU, RemoteSFU } from './callConnections';
import { OWN_SFU } from './callConnections';
import { encodeMessage } from './callDataProtocol';
import type { CallPerson } from './callParticipants';
import { useCallDataChannel } from './useCallDataChannel';

const dispatchToastMessage = jest.fn();

jest.mock('@rocket.chat/ui-contexts', () => ({
	useToastMessageDispatch: () => dispatchToastMessage,
}));

jest.mock('@rocket.chat/ui-conference', () => ({
	playHandRaiseChime: jest.fn(),
}));

jest.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string, options?: { name?: string }) => (options?.name ? `${key}:${options.name}` : key) }),
}));

type Listener = (...args: unknown[]) => void;

const fakeRoom = () => {
	const listeners = new Map<string, Set<Listener>>();
	return {
		on: (event: string, listener: Listener) => {
			listeners.set(event, (listeners.get(event) ?? new Set()).add(listener));
		},
		off: (event: string, listener: Listener) => {
			listeners.get(event)?.delete(listener);
		},
		emit: (event: string, ...args: unknown[]) => listeners.get(event)?.forEach((listener) => listener(...args)),
	};
};

const RC2: RemoteSFU = { local: false, key: 'rc2', serverName: 'rc2', transport: 'wss://lk.rc2' };

const ownRoom = fakeRoom();
const rc2Room = fakeRoom();

const connections: CallConnection[] = [
	{ sfu: OWN_SFU, room: ownRoom as unknown as Room },
	{ sfu: RC2, room: rc2Room as unknown as Room },
];

// alice publishes here as `h-alice`; carol publishes on rc2 as `h-carol`. Anyone else on either SFU is watching it.
const people: Record<string, CallPerson> = {
	'own:h-alice': { id: 'alice', displayName: 'Alice', avatarUrl: '' },
	'rc2:h-carol': { id: 'carol', displayName: 'Carol', avatarUrl: '' },
};
const personOf = (sfu: CallSFU, { identity }: { identity: string }) => people[`${sfu.local ? 'own' : sfu.serverName}:${identity}`];
const targetOf = (personId: string) => ({ alice: 'h-alice', carol: 'h-carol' })[personId];

const localParticipant = {
	identity: 'h-me',
	publishData: jest.fn(() => Promise.resolve()),
	setMicrophoneEnabled: jest.fn(() => Promise.resolve()),
};

const renderChannel = () =>
	renderHook(() => useCallDataChannel(localParticipant as unknown as LocalParticipant, { selfId: 'me', connections, personOf, targetOf }));

const send = (room: ReturnType<typeof fakeRoom>, identity: string, message: Parameters<typeof encodeMessage>[0]) =>
	act(() => room.emit(RoomEvent.DataReceived, encodeMessage(message), { identity, name: `name-of-${identity}` }));

const decodedPublishes = () =>
	(localParticipant.publishData.mock.calls as unknown as [Uint8Array][]).map(([payload]) => JSON.parse(new TextDecoder().decode(payload)));

beforeEach(() => {
	jest.clearAllMocks();
});

it('keys a hand raised on another homeserver’s SFU by the member who raised it', () => {
	const { result } = renderChannel();

	send(rc2Room, 'h-carol', { type: 'hand', raised: true, raisedAt: 10 });

	expect(result.current.raisedHands).toEqual([{ id: 'carol', raisedAt: 10 }]);
});

// Tokens for other servers' members are not hidden, so their watchers are on every SFU too.
it('ignores whatever a watcher sends', () => {
	const { result } = renderChannel();

	send(ownRoom, 'watcher-from-rc2', { type: 'hand', raised: true, raisedAt: 10 });
	send(ownRoom, 'watcher-from-rc2', { type: 'reaction', emoji: '👍' });
	send(ownRoom, 'watcher-from-rc2', { type: 'mute', target: 'h-me' });

	expect(result.current.raisedHands).toEqual([]);
	expect(result.current.activeReactions).toEqual([]);
	expect(localParticipant.setMicrophoneEnabled).not.toHaveBeenCalled();
});

it('names reactions after the member, whichever SFU they came over', () => {
	const { result } = renderChannel();

	send(ownRoom, 'h-alice', { type: 'reaction', emoji: '👍' });
	send(rc2Room, 'h-carol', { type: 'reaction', emoji: '🎉' });

	expect(result.current.activeReactions.map(({ participantId }) => participantId)).toEqual(['alice', 'carol']);
});

// A mute request goes over the asker's own SFU, which the target watches.
it('mutes the reader when a member of another homeserver asks, and says who asked', () => {
	renderChannel();

	send(rc2Room, 'h-carol', { type: 'mute', target: 'h-me' });

	expect(localParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(false);
	expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'info', message: 'You_were_muted_by__name__:Carol' });
});

it('addresses a mute request to the identity the member goes by on their own SFU', () => {
	const { result } = renderChannel();

	act(() => result.current.muteParticipant('carol'));

	expect(decodedPublishes()).toEqual([{ type: 'mute', target: 'h-carol' }]);
});

it('keys the reader’s own hand by their id, not their identity', () => {
	const { result } = renderChannel();

	act(() => result.current.toggleHand());

	expect(result.current.raisedHands.map(({ id }) => id)).toEqual(['me']);
});

// Whoever arrives on any SFU may be watching ours, and the data channel does not replay.
it('restates a raised hand when anyone arrives on any connection', () => {
	const { result } = renderChannel();
	act(() => result.current.toggleHand());
	localParticipant.publishData.mockClear();

	act(() => rc2Room.emit(RoomEvent.ParticipantConnected, { identity: 'h-dave' }));

	expect(decodedPublishes()).toEqual([expect.objectContaining({ type: 'hand', raised: true, rebroadcast: true })]);
});

it('takes a member out of the queue when they leave their SFU', () => {
	const { result } = renderChannel();
	send(rc2Room, 'h-carol', { type: 'hand', raised: true, raisedAt: 10 });

	act(() => rc2Room.emit(RoomEvent.ParticipantDisconnected, { identity: 'h-carol' }));

	expect(result.current.raisedHands).toEqual([]);
});
