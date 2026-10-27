import type { IMessage } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

import { createFakeSearchIndexBackend } from './fakeSearchIndexBackend';
import { createSearchIndexRuntime, toSearchIndexRooms } from './searchIndexRuntime';
import type { IdleSignal } from './searchIndexScheduler';
import { createSearchIndexSession } from './searchIndexSession';
import { createSearchIndexWriter } from './searchIndexWriter';
import { generate } from '../e2ee/crypto/rsa';

// The LSE2EE-19 (C7) lifecycle rules, with the real session, writer and runtime over the FakeBackend.

type Subscription = { rid: string; encrypted?: boolean; lm?: Date };

const neverIdle: IdleSignal = { isIdle: () => false, subscribe: () => () => undefined };

const message = (id: string, rid: string, text: string, encrypted = true): IMessage =>
	({
		_id: id,
		rid,
		msg: text,
		u: { _id: 'u1', username: 'alice' },
		ts: new Date('2026-10-26T12:00:00Z'),
		_updatedAt: new Date('2026-10-26T12:00:00Z'),
		...(encrypted && { t: 'e2e', e2e: 'done' }),
	}) as unknown as IMessage;

let privateKey: CryptoKey;

beforeAll(async () => {
	privateKey = (await generate()).privateKey;
});

const setup = async (
	subscriptions: Subscription[] = [{ rid: 'r1', encrypted: true }],
	{ userId = 'u1', whenRoomsReady }: { userId?: string; whenRoomsReady?: () => Promise<void> } = {},
) => {
	const backend = createFakeSearchIndexBackend();
	// A wipe closes the index, in the FakeBackend and in the desktop app (the bridge wipe ends the session).
	const wipe = jest.spyOn(backend, 'wipe');
	const removeRoom = jest.spyOn(backend, 'removeRoom');

	const emitter = new Emitter<{ E2E_STATE_CHANGED: { prevState: string; nextState: string } }>();
	const setState = (nextState: string) => emitter.emit('E2E_STATE_CHANGED', { prevState: '', nextState });

	const session = createSearchIndexSession(
		{
			on: (type, handler) => emitter.on(type, handler),
			getUserId: () => userId,
			getPrivateKey: () => privateKey,
		},
		{ getBackend: () => backend },
	);
	const writer = createSearchIndexWriter({ getBackend: () => session.getActiveBackend(), delayMs: 0 });
	const runtime = createSearchIndexRuntime({
		session,
		writer,
		syncMessages: jest.fn(async () => ({ updated: [], deleted: [] })),
		decryptMessage: async (decrypted) => decrypted,
		getRooms: () => toSearchIndexRooms(subscriptions),
		getSubscribedRids: () => new Set(subscriptions.map((sub) => sub.rid)),
		...(whenRoomsReady && { whenRoomsReady }),
		idle: neverIdle,
	});

	const login = async () => {
		setState('READY');
		await session.whenSettled();
		await runtime.whenSettled();
	};

	const index = async (...messages: IMessage[]) => {
		messages.forEach((item) => writer.index(item));
		await writer.flush();
	};

	const searchIds = async (text: string) => (await backend.search({ text })).map((hit) => hit.id);

	await login();

	return { backend, wipe, removeRoom, session, writer, runtime, setState, login, index, searchIds, subscriptions };
};

describe('search index lifecycle (LSE2EE-19)', () => {
	it('keeps the sealed index on logout, so the next login finds the old messages (D8)', async () => {
		const { wipe, setState, login, index, searchIds, session } = await setup();
		await index(message('m1', 'r1', 'quokka sealed'));

		setState('DISABLED');
		expect(session.getActiveBackend()).toBeUndefined();
		await login();

		expect(wipe).not.toHaveBeenCalled();
		expect(await searchIds('quokka')).toEqual(['m1']);
	});

	it('wipes the open index when the user resets the own E2E key', async () => {
		const { wipe, index, searchIds, runtime, backend } = await setup();
		await index(message('m1', 'r1', 'narwhal reset'));

		await expect(runtime.wipe()).resolves.toBe(true);

		expect(wipe).toHaveBeenCalledTimes(1);
		// The wipe closes the index, like the desktop app: the next login opens an empty one.
		await expect(backend.stats()).rejects.toThrow('not open');
		await backend.open({ userId: 'u1' });
		expect(await searchIds('narwhal')).toEqual([]);
	});

	it('sends a document that was queued before the key reset to no index', async () => {
		const { writer, runtime, searchIds, backend } = await setup();
		writer.index(message('m1', 'r1', 'queued walrus'));

		await runtime.wipe();
		await writer.flush();
		await backend.open({ userId: 'u1' });

		expect(await searchIds('walrus')).toEqual([]);
	});

	// LSE2EE-77: a user who forgot the E2E password resets the key while E2EE is locked, so no index is open. The new key
	// cannot open the old index, and no file of it must stay: the backend deletes the index of the logged-in user.
	it('deletes the closed index of the user when the key is reset while E2EE is locked', async () => {
		const { wipe, runtime, setState, index, searchIds, backend } = await setup();
		await index(message('m1', 'r1', 'locked narwhal'));
		setState('DISABLED');

		await expect(runtime.wipe()).resolves.toBe(true);

		expect(wipe).toHaveBeenCalledTimes(1);
		expect(wipe).toHaveBeenCalledWith({ userId: 'u1' });
		await backend.open({ userId: 'u1' });
		expect(await searchIds('narwhal')).toEqual([]);
	});

	it('reports that nothing was wiped when no index is open and no user is logged in', async () => {
		const { wipe, runtime } = await setup(undefined, { userId: '' });

		await expect(runtime.wipe()).resolves.toBe(false);
		expect(wipe).not.toHaveBeenCalled();
	});

	it('removes the rows of a room when its subscription is removed', async () => {
		const { removeRoom, index, searchIds, runtime, subscriptions } = await setup([
			{ rid: 'r1', encrypted: true },
			{ rid: 'r2', encrypted: true },
		]);
		await index(message('m1', 'r1', 'ocelot left'), message('m2', 'r2', 'ocelot stays'));

		subscriptions.splice(0, 1);
		await runtime.onRoomRemoved('r1');

		expect(removeRoom).toHaveBeenCalledWith('r1');
		expect(await searchIds('ocelot')).toEqual(['m2']);
	});

	it('removes also the documents of the room that were still queued', async () => {
		const { writer, runtime, searchIds } = await setup();
		writer.index(message('m1', 'r1', 'queued lynx'));

		await runtime.onRoomRemoved('r1');
		await writer.flush();

		expect(await searchIds('lynx')).toEqual([]);
	});

	it('stops indexing a room that is no longer encrypted and keeps its rows', async () => {
		const { removeRoom, wipe, index, searchIds, subscriptions } = await setup();
		await index(message('m1', 'r1', 'tapir before'));

		subscriptions[0].encrypted = false;
		await index(message('m2', 'r1', 'tapir after', false));

		expect(removeRoom).not.toHaveBeenCalled();
		expect(wipe).not.toHaveBeenCalled();
		expect(await searchIds('tapir')).toEqual(['m1']);
	});

	// LSE2EE-78: the user left a room while the index was closed (app closed, logged out, E2EE locked). No removal event
	// reaches the index, so the open removes each indexed room that has no subscription.
	it('removes at open the rooms that the user left while the index was closed', async () => {
		const { setState, login, index, searchIds, subscriptions, removeRoom } = await setup([
			{ rid: 'r1', encrypted: true },
			{ rid: 'r2', encrypted: true },
			{ rid: 'r3', encrypted: true },
		]);
		await index(message('m1', 'r1', 'margay left'), message('m2', 'r2', 'margay stays'), message('m3', 'r3', 'margay unencrypted'));
		setState('DISABLED');

		subscriptions.splice(0, 1);
		subscriptions[1].encrypted = false;
		await login();

		expect(removeRoom.mock.calls).toEqual([['r1']]);
		expect(await searchIds('margay')).toEqual(['m2', 'm3']);
	});

	it('waits for the subscription list before it removes rooms at open', async () => {
		let ready: Promise<void> = Promise.resolve();
		const subscriptions: Subscription[] = [{ rid: 'r1', encrypted: true }];
		const { setState, session, runtime, index, searchIds, removeRoom } = await setup(subscriptions, { whenRoomsReady: () => ready });
		await index(message('m1', 'r1', 'serval kept'));
		setState('DISABLED');

		// After a reload the subscription store starts empty and fills from the cache or the server.
		let markReady = (): void => undefined;
		ready = new Promise((resolve) => {
			markReady = resolve;
		});
		subscriptions.splice(0, 1);
		setState('READY');
		await session.whenSettled();
		await Promise.resolve();
		expect(removeRoom).not.toHaveBeenCalled();

		subscriptions.push({ rid: 'r1', encrypted: true });
		markReady();
		await runtime.whenSettled();

		expect(removeRoom).not.toHaveBeenCalled();
		expect(await searchIds('serval')).toEqual(['m1']);
	});
});
