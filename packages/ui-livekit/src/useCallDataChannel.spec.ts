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

describe('in a federated call', () => {
	const federation = (hands: Record<string, number> = {}) => {
		let deliver: ((reaction: { uid: string; emoji: string; reactionId: string }) => void) | undefined;
		return {
			hands,
			subscribeReactions: jest.fn((listener) => {
				deliver = listener;
				return () => {
					deliver = undefined;
				};
			}),
			raiseHand: jest.fn(),
			react: jest.fn(),
			deliver: (reaction: { uid: string; emoji: string; reactionId: string }) => act(() => deliver?.(reaction)),
		};
	};

	const renderFederated = (signals: ReturnType<typeof federation>) =>
		renderHook(
			({ signals: current }) =>
				useCallDataChannel(localParticipant as unknown as LocalParticipant, {
					selfId: 'me',
					connections,
					personOf,
					targetOf,
					federation: current,
				}),
			{ initialProps: { signals } },
		);

	// Their server tells the room, and the room is what reaches us: the data channel would only say it twice.
	it('takes the hands and reactions of other servers’ members from the room, not from their SFU', () => {
		const signals = federation();
		const { result } = renderFederated(signals);

		send(rc2Room, 'h-carol', { type: 'hand', raised: true, raisedAt: 10 });
		send(rc2Room, 'h-carol', { type: 'reaction', emoji: '👍' });

		expect(result.current.raisedHands).toEqual([]);
		expect(result.current.activeReactions).toEqual([]);
	});

	it('still hears this server’s members over the call', () => {
		const { result } = renderFederated(federation());

		send(ownRoom, 'h-alice', { type: 'hand', raised: true, raisedAt: 10 });

		expect(result.current.raisedHands).toEqual([{ id: 'alice', raisedAt: 10 }]);
	});

	it('still obeys a mute request from a member of another server', () => {
		renderFederated(federation());

		send(rc2Room, 'h-carol', { type: 'mute', target: 'h-me' });

		expect(localParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(false);
	});

	it('queues the hands the room says other servers’ members raised, with this server’s', () => {
		const { result } = renderFederated(federation({ carol: 5 }));

		send(ownRoom, 'h-alice', { type: 'hand', raised: true, raisedAt: 10 });

		expect(result.current.raisedHands).toEqual([
			{ id: 'carol', raisedAt: 5 },
			{ id: 'alice', raisedAt: 10 },
		]);
	});

	it('shows the reactions the room says other servers’ members made', () => {
		const signals = federation();
		const { result } = renderFederated(signals);

		signals.deliver({ uid: 'carol', emoji: '👏', reactionId: '$reaction' });

		expect(result.current.activeReactions).toEqual([expect.objectContaining({ id: '$reaction', participantId: 'carol', emoji: '👏' })]);
	});

	it('tells the room about the reader’s hand and reactions, as well as the call', () => {
		const signals = federation();
		const { result } = renderFederated(signals);

		act(() => result.current.toggleHand());
		act(() => result.current.sendReaction('🎉'));
		act(() => result.current.toggleHand());

		expect(signals.raiseHand.mock.calls).toEqual([[true], [false]]);
		expect(signals.react).toHaveBeenCalledWith('🎉');
		expect(decodedPublishes().map(({ type }) => type)).toEqual(['hand', 'reaction', 'hand']);
	});
});
