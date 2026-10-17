import { act, renderHook } from '@testing-library/react';

import type { CallMember } from './callRoster';
import { useRemoteSFUConnections } from './useRemoteSFUConnections';

const getFederatedToken = jest.fn();
const rooms: { connect: jest.Mock; disconnect: jest.Mock }[] = [];

jest.mock('livekit-client', () => ({
	...jest.requireActual('livekit-client'),
	Room: jest.fn(() => {
		const room = { connect: jest.fn(() => Promise.resolve()), disconnect: jest.fn(() => Promise.resolve()) };
		rooms.push(room);
		return room;
	}),
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	useEndpoint: () => getFederatedToken,
	useToastMessageDispatch: () => jest.fn(),
}));

const member = (_id: string, serverName: string, rest: Partial<CallMember> = {}): CallMember => ({
	_id,
	username: `@${_id}:${serverName}`,
	name: _id,
	federation: { serverName, transport: `wss://lk.${serverName}`, livekitIdentity: `h-${_id}`, local: serverName === 'rc1' },
	...rest,
});

const renderConnections = (members: CallMember[], connect = true) =>
	renderHook(({ members, connect }) => useRemoteSFUConnections('call1', connect, members), { initialProps: { members, connect } });

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

beforeEach(() => {
	rooms.length = 0;
	getFederatedToken.mockReset();
	getFederatedToken.mockImplementation(async ({ serverName }: { serverName: string }) => ({
		serverUrl: `wss://lk.${serverName}`,
		token: `token-${serverName}`,
	}));
});

it('asks this server for a token to each other homeserver’s SFU, naming the call and the SFU', async () => {
	const { result } = renderConnections([member('alice', 'rc1'), member('carol', 'rc2')]);
	await settle();

	expect(getFederatedToken).toHaveBeenCalledWith({ callId: 'call1', serverName: 'rc2', transport: 'wss://lk.rc2' });
	expect(rooms[0].connect).toHaveBeenCalledWith('wss://lk.rc2', 'token-rc2');
	expect(result.current.map(({ sfu }) => sfu.serverName)).toEqual(['rc2']);
});

// The roster is read again on every change to the call, and most changes are not a new SFU.
it('keeps a connection while the roster changes around it', async () => {
	const { rerender } = renderConnections([member('carol', 'rc2')]);
	await settle();

	rerender({ members: [member('carol', 'rc2'), member('dave', 'rc2')], connect: true });
	await settle();

	expect(getFederatedToken).toHaveBeenCalledTimes(1);
	expect(rooms[0].disconnect).not.toHaveBeenCalled();
});

it('closes a connection once nobody publishing there is in the call', async () => {
	const { rerender, result } = renderConnections([member('carol', 'rc2')]);
	await settle();

	rerender({ members: [member('carol', 'rc2', { leftAt: new Date() })], connect: true });

	expect(rooms[0].disconnect).toHaveBeenCalled();
	expect(result.current).toEqual([]);
});

it('connects to nothing before the reader is in the call, and closes everything when they leave', async () => {
	const { rerender } = renderConnections([member('carol', 'rc2')], false);
	await settle();
	expect(getFederatedToken).not.toHaveBeenCalled();

	rerender({ members: [member('carol', 'rc2')], connect: true });
	await settle();
	rerender({ members: [member('carol', 'rc2')], connect: false });

	expect(rooms[0].disconnect).toHaveBeenCalled();
});
