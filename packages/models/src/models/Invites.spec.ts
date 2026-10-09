import type { IInvite } from '@rocket.chat/core-typings';
import { MongoClient, MongoServerError } from 'mongodb';
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
		await expect(model.migrateLegacyInvites(['old-id'], new Date(), { inTransaction: () => false } as ClientSession)).rejects.toThrow(
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
			await session.withTransaction(async () => model.migrateLegacyInvites([legacyInvite._id], expiresAt, session));
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

	it('migrates 100 invites using one bulk read, insert, and removal while preserving every record', async () => {
		const originals = Array.from({ length: 100 }, (_, index) => ({
			...legacyInvite,
			_id: index === 0 ? legacyInvite._id : `Old${index}`,
			expires: index % 2 ? new Date('2026-10-20') : null,
			uses: index % 5,
		}));
		await model.col.deleteMany({});
		await model.col.insertMany(originals as IInvite[]);
		const ids = originals.map(({ _id }) => _id);
		const read = jest.spyOn(model.col, 'find');
		const insert = jest.spyOn(model.col, 'insertMany');
		const remove = jest.spyOn(model.col, 'deleteMany');
		try {
			await client.withSession(async (session) => {
				await session.withTransaction(async () => model.migrateLegacyInvites(ids, deadline, session));
			});
			expect(read).toHaveBeenCalledTimes(1);
			expect(insert).toHaveBeenCalledTimes(1);
			expect(remove).toHaveBeenCalledTimes(1);
		} finally {
			read.mockRestore();
			insert.mockRestore();
			remove.mockRestore();
		}

		const migrated = await model.col.find({}).toArray();
		expect(migrated).toHaveLength(originals.length);
		const byToken = new Map(migrated.map((invite) => [invite.inviteToken, invite]));
		for (const original of originals) {
			const replacement = byToken.get(original._id);
			expect(replacement).toMatchObject({
				...original,
				_id: expect.any(String),
				inviteToken: original._id,
				legacy: true,
				expires: original.expires ?? deadline,
				url: '',
			});
			expect(replacement?._id).not.toBe(original._id);
		}
	});

	it('rolls back the whole chunk if a replacement conflicts with an existing token', async () => {
		const second = { ...legacyInvite, _id: 'Bad456' };
		const strong = { ...legacyInvite, _id: 'strong-id', inviteToken: second._id };
		await model.col.insertMany([second as IInvite, strong]);
		await expect(
			client.withSession(async (session) => {
				await session.withTransaction(async () => model.migrateLegacyInvites([legacyInvite._id, second._id], deadline, session));
			}),
		).rejects.toMatchObject({ code: 11000 });
		expect(await model.col.findOne({ _id: legacyInvite._id })).toEqual(legacyInvite);
		expect(await model.col.findOne({ _id: second._id })).toEqual(second);
		expect(await model.findOneById(strong._id)).toEqual(strong);
		expect(await model.col.countDocuments()).toBe(3);
	});

	it('retries a whole transaction without duplicating replacements or extending expiry', async () => {
		const second = { ...legacyInvite, _id: 'Old456' };
		await model.col.insertOne(second as IInvite);
		let attempts = 0;
		await client.withSession(async (session) => {
			await session.withTransaction(async () => {
				attempts++;
				await model.migrateLegacyInvites([legacyInvite._id, second._id], deadline, session);
				if (attempts === 1) {
					const error = new MongoServerError({ message: 'retry migration', code: 112 });
					error.addErrorLabel('TransientTransactionError');
					throw error;
				}
			});
		});
		expect(attempts).toBe(2);
		expect(await model.col.countDocuments()).toBe(2);
		for (const _id of [legacyInvite._id, second._id]) {
			expect(await model.findOneByInviteToken(_id)).toMatchObject({ legacy: true, expires: deadline, uses: legacyInvite.uses });
			expect(await model.findOneById(_id)).toBeNull();
		}
	});

	it('rolls back both the insert and removal when a transaction fails', async () => {
		await expect(
			client.withSession(async (session) => {
				await session.withTransaction(async () => {
					await model.migrateLegacyInvites([legacyInvite._id], deadline, session);
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
			await session.withTransaction(async () => model.migrateLegacyInvites([strong._id], deadline, session));
		});
		expect(await model.findOneById(strong._id)).toEqual(strong);
		await expect(model.col.insertOne({ ...strong, _id: 'another-id' })).rejects.toMatchObject({ code: 11000 });
	});
});
