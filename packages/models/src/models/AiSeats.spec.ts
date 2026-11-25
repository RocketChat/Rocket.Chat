import type { IAiSeatsModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AiSeatsRaw } from './AiSeats';

let mongo: MongoMemoryServer;
let client: MongoClient;
let db: Db;
let seats: AiSeatsRaw;

const now = new Date('2026-11-20T00:00:00Z');

const registration = (seatId: string, botUserId = `bot-${seatId}`) => ({
	engineId: 'engine-1',
	seatId,
	botUserId,
	allowedRoomIds: ['room-1'],
	allowedToolIds: ['docs_search'],
	allowedRouteIds: ['route-1'],
	registeredBy: 'admin-1',
	registeredAt: now,
});

beforeAll(async () => {
	mongo = await MongoMemoryServer.create();
	client = await MongoClient.connect(mongo.getUri());
	db = client.db('ai_seats_test');
	seats = new AiSeatsRaw(db);
	await seats.createIndexes();
});

afterAll(async () => {
	await client.close();
	await mongo.stop();
});

beforeEach(async () => {
	await seats.col.deleteMany({});
});

describe('AiSeatsRaw.registerSeat', () => {
	it('stores a new seat as registered', async () => {
		await seats.registerSeat(registration('seat-01'));

		await expect(seats.findOneBySeatId('seat-01')).resolves.toMatchObject({ ...registration('seat-01'), state: 'registered' });
	});

	it('refuses a seat id that is already registered', async () => {
		await seats.registerSeat(registration('seat-01'));

		await expect(seats.registerSeat(registration('seat-01', 'another-bot'))).rejects.toThrow(/duplicate key/);
	});

	it('refuses a seat id that was retired, so it is never registered again', async () => {
		await seats.registerSeat(registration('seat-01'));
		await seats.retireSeat('seat-01', 'admin-1', now);

		await expect(seats.registerSeat(registration('seat-01', 'another-bot'))).rejects.toThrow(/duplicate key/);
	});

	it('refuses a bot that is already registered to another seat', async () => {
		await seats.registerSeat(registration('seat-01', 'bot-shared'));

		await expect(seats.registerSeat(registration('seat-02', 'bot-shared'))).rejects.toThrow(/duplicate key/);
	});
});

describe('AiSeatsRaw.claimSeat', () => {
	it('claims a registered seat for the agent', async () => {
		await seats.registerSeat(registration('seat-01'));

		const result = await seats.claimSeat('seat-01', 'agent-1', now);

		expect(result.modifiedCount).toBe(1);
		await expect(seats.findOneBySeatId('seat-01')).resolves.toMatchObject({ state: 'claimed', agentId: 'agent-1', claimedAt: now });
	});

	it('lets only one of two agents claim the same seat', async () => {
		await seats.registerSeat(registration('seat-01'));

		const results = await Promise.all([seats.claimSeat('seat-01', 'agent-1', now), seats.claimSeat('seat-01', 'agent-2', now)]);

		expect(results.map((result) => result.modifiedCount).sort()).toEqual([0, 1]);
	});

	it('does not claim a seat that is retired', async () => {
		await seats.registerSeat(registration('seat-01'));
		await seats.retireSeat('seat-01', 'admin-1', now);

		const result = await seats.claimSeat('seat-01', 'agent-1', now);

		expect(result.modifiedCount).toBe(0);
		await expect(seats.findOneBySeatId('seat-01')).resolves.toMatchObject({ state: 'retired' });
	});
});

describe('AiSeatsRaw.retireSeat', () => {
	it.each(['registered', 'claimed'])('retires a %s seat', async (state) => {
		await seats.registerSeat(registration('seat-01'));
		if (state === 'claimed') {
			await seats.claimSeat('seat-01', 'agent-1', now);
		}

		const result = await seats.retireSeat('seat-01', 'admin-1', now);

		expect(result.modifiedCount).toBe(1);
		await expect(seats.findOneBySeatId('seat-01')).resolves.toMatchObject({ state: 'retired', retiredBy: 'admin-1', retiredAt: now });
	});

	it('keeps the first retirement when a seat is retired again', async () => {
		await seats.registerSeat(registration('seat-01'));
		await seats.retireSeat('seat-01', 'admin-1', now);

		const again = await seats.retireSeat('seat-01', 'admin-2', new Date(now.getTime() + 1000));

		expect(again.modifiedCount).toBe(0);
		await expect(seats.findOneBySeatId('seat-01')).resolves.toMatchObject({ retiredBy: 'admin-1', retiredAt: now });
	});

	it('offers no other way to change a seat (checked by the type checker)', () => {
		type Writes = 'updateOne' | 'updateMany' | 'update' | 'findOneAndUpdate' | 'updateFromUpdater';
		type OffersNone<K extends string> = [Extract<K, keyof IAiSeatsModel>] extends [never] ? true : false;
		const offersNoGenericWrite: OffersNone<Writes> = true;
		const offersClaimAndRetire: OffersNone<'claimSeat' | 'retireSeat'> = false;

		expect([offersNoGenericWrite, offersClaimAndRetire]).toEqual([true, false]);
	});
});
