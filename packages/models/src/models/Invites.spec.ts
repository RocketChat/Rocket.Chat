import type { IInvite } from '@rocket.chat/core-typings';
import { MongoClient } from 'mongodb';
import type { ClientSession, Db } from 'mongodb';

import { InvitesRaw } from './Invites';

jest.mock('..', () => ({ getCollectionName: (name: string) => name, UpdaterImpl: class {} }));

describe('InvitesRaw', () => {
	const findOne = jest.fn();
	const createIndexes = jest.fn().mockResolvedValue([]);
	const model = new InvitesRaw({ collection: () => ({ findOne, createIndexes }) } as unknown as Db);

	beforeEach(() => findOne.mockReset().mockResolvedValue(null));

	it('does not reuse legacy tokens when a creator requests an invite URL', async () => {
		await model.findOneByUserRoomMaxUsesAndExpiration('creator', 'room', 5, 0);
		expect(findOne.mock.calls[0][0]).toMatchObject({
			legacy: { $ne: true },
			inviteToken: { $type: 'string' },
			$or: [{ expires: null }, { expires: { $gt: expect.any(Date) } }],
		});
	});

	it('requires a transaction before changing a legacy record ID', async () => {
		await expect(model.migrateLegacyInvite('old-id', new Date(), { inTransaction: () => false } as ClientSession)).rejects.toThrow(
			'requires a transaction',
		);
		expect(findOne).not.toHaveBeenCalled();
	});
});

const mongoUrl = process.env.INVITES_TEST_MONGO_URL;
const describeWithMongo = mongoUrl ? describe : describe.skip;

describeWithMongo('InvitesRaw migration with MongoDB transactions', () => {
	let client: MongoClient;
	let db: Db;
	let model: InvitesRaw;
	const deadline = new Date('2027-01-07T00:00:00Z');
	const legacyInvite: Omit<IInvite, 'inviteToken'> = {
		_id: 'Old123',
		rid: 'private-room',
		userId: 'creator',
		days: 0,
		maxUses: 5,
		uses: 2,
		createdAt: new Date('2026-01-01'),
		_updatedAt: new Date('2026-01-02'),
		expires: null,
		url: 'https://chat.example/invite/Old123',
	};

	beforeAll(async () => {
		client = new MongoClient(mongoUrl || 'mongodb://127.0.0.1:27017');
		await client.connect();
		db = client.db(`invite_migration_test_${Date.now()}`);
		model = new InvitesRaw(db);
		await model.createIndexes();
	});

	afterAll(async () => {
		await db?.dropDatabase();
		await client?.close();
	});

	beforeEach(async () => {
		await model.col.deleteMany({});
		await model.col.insertOne(legacyInvite as IInvite);
	});

	const migrate = async (expiresAt = deadline) =>
		client.withSession(async (session) => {
			await session.withTransaction(async () => model.migrateLegacyInvite(legacyInvite._id, expiresAt, session));
		});

	it('preserves old URLs and limits while separating their tokens from the listed record IDs', async () => {
		await migrate();
		const migrated = await model.findOneByInviteToken(legacyInvite._id);
		expect(migrated).toMatchObject({
			...legacyInvite,
			_id: expect.any(String),
			inviteToken: legacyInvite._id,
			legacy: true,
			expires: deadline,
			url: '',
		});
		expect(migrated?._id).not.toBe(legacyInvite._id);
		expect(await model.findOneById(legacyInvite._id)).toBeNull();
		const [listed] = await model.findInvitesForManagement().toArray();
		expect(listed._id).toBe(migrated?._id);
		expect(listed).not.toHaveProperty('inviteToken');
		expect(listed).not.toHaveProperty('url');
		expect(await model.findOneByUserRoomMaxUsesAndExpiration('creator', 'private-room', 5, 0)).toBeNull();
	});

	it.each([new Date('2026-01-01'), new Date('2026-10-20')])(
		'preserves the dated expiry %s, including expired invites',
		async (originalExpiry) => {
			await model.col.updateOne({ _id: legacyInvite._id }, { $set: { expires: originalExpiry, days: 15 } });
			await migrate();
			expect((await model.findOneByInviteToken(legacyInvite._id))?.expires).toEqual(originalExpiry);
		},
	);

	it('does not change migrated IDs, deadlines, or usage when rerun', async () => {
		await migrate();
		const first = await model.findOneByInviteToken(legacyInvite._id);
		await migrate(new Date('2028-01-01'));
		expect(await model.findOneByInviteToken(legacyInvite._id)).toEqual(first);
		expect(await model.col.countDocuments()).toBe(1);
	});

	it('rolls back both the insert and removal when a transaction fails', async () => {
		await expect(
			client.withSession(async (session) => {
				await session.withTransaction(async () => {
					await model.migrateLegacyInvite(legacyInvite._id, deadline, session);
					throw new Error('interrupted migration');
				});
			}),
		).rejects.toThrow('interrupted migration');
		expect(await model.col.findOne({ _id: legacyInvite._id })).toEqual(legacyInvite);
		expect(await model.col.countDocuments()).toBe(1);
		await migrate();
		expect(await model.findOneByInviteToken(legacyInvite._id)).not.toBeNull();
	});

	it('retains existing strong tokens and enforces token uniqueness', async () => {
		const strong = { ...legacyInvite, _id: 'strong-id', inviteToken: 'strong-token', expires: null };
		await model.col.insertOne(strong);
		await client.withSession(async (session) => {
			await session.withTransaction(async () => model.migrateLegacyInvite(strong._id, deadline, session));
		});
		expect(await model.findOneById(strong._id)).toEqual(strong);
		await expect(model.col.insertOne({ ...strong, _id: 'another-id' })).rejects.toMatchObject({ code: 11000 });
	});
});
