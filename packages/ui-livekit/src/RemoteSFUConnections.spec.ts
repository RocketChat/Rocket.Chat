import type { Room } from 'livekit-client';

import { RemoteSFUConnections } from './RemoteSFUConnections';
import type { RemoteSFU } from './callConnections';

const sfu = (serverName: string): RemoteSFU => ({ local: false, key: serverName, serverName, transport: `wss://lk.${serverName}` });

type FakeRoom = {
	connect: jest.Mock;
	disconnect: jest.Mock;
	localParticipant: { publishData: jest.Mock; setMicrophoneEnabled: jest.Mock };
};

const createRoom = (): FakeRoom => ({
	connect: jest.fn(() => Promise.resolve()),
	disconnect: jest.fn(() => Promise.resolve()),
	localParticipant: { publishData: jest.fn(), setMicrophoneEnabled: jest.fn() },
});

const setup = () => {
	const rooms: FakeRoom[] = [];
	const connections = new RemoteSFUConnections(() => {
		const room = createRoom();
		rooms.push(room);
		return room as unknown as Room;
	});
	const credentialsFor = jest.fn(async ({ serverName }: RemoteSFU) => ({
		serverUrl: `wss://lk.${serverName}`,
		token: `token-${serverName}`,
	}));
	const onError = jest.fn();
	const sync = (...wanted: RemoteSFU[]) => connections.sync(wanted, credentialsFor, onError);
	const roomFor = (serverName: string) =>
		connections.getSnapshot().find((connection) => connection.sfu.serverName === serverName)?.room as unknown as FakeRoom | undefined;
	return { connections, rooms, credentialsFor, onError, sync, roomFor };
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

it('asks for a token when an SFU appears, and connects with it', async () => {
	const { sync, credentialsFor, roomFor } = setup();

	sync(sfu('rc2'));
	await settle();

	expect(credentialsFor).toHaveBeenCalledWith(sfu('rc2'));
	expect(roomFor('rc2')?.connect).toHaveBeenCalledWith('wss://lk.rc2', 'token-rc2');
});

it('opens each SFU once, however often the roster is read again', async () => {
	const { sync, credentialsFor, rooms } = setup();

	sync(sfu('rc2'));
	sync(sfu('rc2'));
	sync(sfu('rc2'), sfu('rc3'));
	await settle();

	expect(credentialsFor).toHaveBeenCalledTimes(2);
	expect(rooms).toHaveLength(2);
});

it('closes the connection to an SFU whose members have all gone', async () => {
	const { sync, connections, rooms } = setup();

	sync(sfu('rc2'), sfu('rc3'));
	await settle();
	sync(sfu('rc3'));

	expect(rooms[0].disconnect).toHaveBeenCalled();
	expect(rooms[1].disconnect).not.toHaveBeenCalled();
	expect(connections.getSnapshot().map(({ sfu }) => sfu.serverName)).toEqual(['rc3']);
});

it('never connects an SFU dropped while its token was on the way', async () => {
	const { sync, rooms } = setup();

	sync(sfu('rc2'));
	sync();
	await settle();

	expect(rooms[0].connect).not.toHaveBeenCalled();
});

// The connections are only ever watched: nothing of the reader's goes out on them.
it('publishes nothing on the connections it opens', async () => {
	const { sync, rooms } = setup();

	sync(sfu('rc2'));
	await settle();

	expect(rooms[0].localParticipant.publishData).not.toHaveBeenCalled();
	expect(rooms[0].localParticipant.setMicrophoneEnabled).not.toHaveBeenCalled();
});

it('reports an SFU it could not reach and drops it, so it is asked again', async () => {
	const { sync, credentialsFor, onError, connections } = setup();
	credentialsFor.mockRejectedValueOnce(new Error('error-federation-unreachable'));

	sync(sfu('rc2'));
	await settle();

	expect(onError).toHaveBeenCalledWith(expect.any(Error));
	expect(connections.getSnapshot()).toEqual([]);

	sync(sfu('rc2'));
	await settle();
	expect(credentialsFor).toHaveBeenCalledTimes(2);
});

it('tells its listeners when the connections change, and closes them all at the end', async () => {
	const { sync, connections, rooms } = setup();
	const listener = jest.fn();
	connections.subscribe(listener);

	sync(sfu('rc2'));
	sync(sfu('rc2'));
	expect(listener).toHaveBeenCalledTimes(1);

	connections.close();
	expect(rooms[0].disconnect).toHaveBeenCalled();
	expect(connections.getSnapshot()).toEqual([]);
	expect(listener).toHaveBeenCalledTimes(2);
});
