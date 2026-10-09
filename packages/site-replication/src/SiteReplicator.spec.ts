import type { Db, Document, MongoClient } from 'mongodb';
import type { MongoMemoryReplSet } from 'mongodb-memory-server';

import { converged, createSites, startReplicaSets, THRESHOLD_MS, waitFor } from './test/harness';
import type { Network, TestSite } from './test/harness';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Doc = Document & { _id: string };

const rooms = (db: Db) => db.collection<Doc>('rocketchat_room');
const messages = (db: Db) => db.collection<Doc>('rocketchat_message');
const subscriptions = (db: Db) => db.collection<Doc>('rocketchat_subscription');

const postMessage = async (db: Db, _id: string, rid: string, uid: string, msg: string) => {
	const ts = new Date();
	await messages(db).insertOne({ _id, rid, msg, ts, u: { _id: uid, username: uid }, _updatedAt: ts });
	await rooms(db).updateOne({ _id: rid }, { $inc: { msgs: 1 }, $set: { lm: ts, _updatedAt: ts } });
};

describe('SiteReplicator with two sites', () => {
	let sets: MongoMemoryReplSet[];
	let clients: MongoClient[];
	let network: Network;
	let a: TestSite;
	let b: TestSite;
	let dbCount = 0;

	beforeAll(async () => {
		({ sets, clients } = await startReplicaSets());
	}, 120_000);

	afterAll(async () => {
		await Promise.all(clients.map((client) => client.close()));
		await Promise.all(sets.map((set) => set.stop()));
	});

	beforeEach(async () => {
		network = { up: true };
		[a, b] = await createSites(clients, `site_replication_${++dbCount}`, network);
		await a.start();
		await b.start();
		await rooms(a.db).insertOne({ _id: 'general', name: 'general', t: 'c', msgs: 0, usersCount: 2, _updatedAt: new Date() });
		await converged(a, b);
	});

	afterEach(async () => {
		await a.replicator.stop();
		await b.replicator.stop();
	});

	const partition = async () => {
		network.up = false;
		await sleep(THRESHOLD_MS + 300);
	};

	const heal = async () => {
		network.up = true;
		await converged(a, b, 20_000);
	};

	it('replicates writes both ways and reports them to the receiving site', async () => {
		await postMessage(a.db, 'm-a', 'general', 'alice', 'hello from A');
		await postMessage(b.db, 'm-b', 'general', 'bob', 'hello from B');
		await converged(a, b);

		expect(await messages(b.db).findOne({ _id: 'm-a' })).toMatchObject({ msg: 'hello from A' });
		expect(await messages(a.db).findOne({ _id: 'm-b' })).toMatchObject({ msg: 'hello from B' });
		expect(await rooms(a.db).findOne({ _id: 'general' })).toMatchObject({ msgs: 2 });
		expect(b.notifications).toEqual(
			expect.arrayContaining([expect.objectContaining({ coll: 'rocketchat_message', id: 'm-a', action: 'inserted' })]),
		);
	});

	it('does not send a site its own writes back', async () => {
		await postMessage(a.db, 'm-1', 'general', 'alice', 'one');
		await converged(a, b);
		await sleep(300);
		expect(a.notifications.filter((change) => change.id === 'm-1')).toEqual([]);
		expect(await rooms(a.db).findOne({ _id: 'general' })).toMatchObject({ msgs: 1 });
	});

	it('adds up counter increments made on both sides while disconnected', async () => {
		await partition();
		await rooms(a.db).updateOne({ _id: 'general' }, { $inc: { msgs: 2 } });
		await rooms(b.db).updateOne({ _id: 'general' }, { $inc: { msgs: 3, usersCount: 1 } });
		await heal();

		expect(await rooms(a.db).findOne({ _id: 'general' })).toMatchObject({ msgs: 5, usersCount: 3 });
	});

	it('keeps the newer write to a field and both sides of writes to different fields', async () => {
		await partition();
		await rooms(a.db).updateOne({ _id: 'general' }, { $set: { topic: 'older', description: 'from A' } });
		await sleep(20);
		await rooms(b.db).updateOne({ _id: 'general' }, { $set: { topic: 'newer', announcement: 'from B' } });
		await heal();

		expect(await rooms(a.db).findOne({ _id: 'general' })).toMatchObject({
			topic: 'newer',
			description: 'from A',
			announcement: 'from B',
		});
	});

	it('joins set elements added on both sides while disconnected', async () => {
		await postMessage(a.db, 'm-react', 'general', 'alice', 'react to me');
		await converged(a, b);
		await partition();
		await messages(a.db).updateOne({ _id: 'm-react' }, { $set: { 'reactions.:+1:': { usernames: ['alice'] } } });
		await messages(b.db).updateOne({ _id: 'm-react' }, { $set: { 'reactions.:+1:': { usernames: ['bob'] } } });
		await heal();

		const message = await messages(a.db).findOne({ _id: 'm-react' });
		expect([...(message?.reactions[':+1:'].usernames ?? [])].sort()).toEqual(['alice', 'bob']);
	});

	it('lets a delete win over a concurrent edit', async () => {
		await postMessage(a.db, 'm-del', 'general', 'alice', 'soon gone');
		await converged(a, b);
		await partition();
		await messages(a.db).deleteOne({ _id: 'm-del' });
		await sleep(20);
		await messages(b.db).updateOne({ _id: 'm-del' }, { $set: { msg: 'edited', _updatedAt: new Date() } });
		await heal();

		expect(await messages(b.db).findOne({ _id: 'm-del' })).toBeNull();
	});

	it('merges two subscriptions created for the same user and room while disconnected', async () => {
		await rooms(a.db).insertOne({ _id: 'alicebob', t: 'd', msgs: 0, usersCount: 2, _updatedAt: new Date() });
		await converged(a, b);
		await partition();
		await subscriptions(a.db).insertOne({ _id: 'sub-a', rid: 'alicebob', u: { _id: 'alice' }, unread: 0, alert: false });
		await sleep(20);
		await subscriptions(b.db).insertOne({ _id: 'sub-b', rid: 'alicebob', u: { _id: 'alice' }, unread: 0, alert: true });
		await subscriptions(b.db).updateOne({ _id: 'sub-b' }, { $inc: { unread: 3 } });
		await subscriptions(a.db).updateOne({ _id: 'sub-a' }, { $inc: { unread: 1 } });
		await heal();

		const remaining = await subscriptions(b.db).find({ rid: 'alicebob' }).toArray();
		expect(remaining).toEqual([expect.objectContaining({ _id: 'sub-a', unread: 4, alert: true })]);
	});

	it('suffixes the later of two rooms created with the same name, with its subscriptions', async () => {
		await partition();
		await rooms(a.db).insertOne({ _id: 'ops-a', name: 'ops', fname: 'ops', t: 'c', msgs: 0, _updatedAt: new Date() });
		await subscriptions(a.db).insertOne({ _id: 'sub-ops-a', rid: 'ops-a', name: 'ops', fname: 'ops', u: { _id: 'alice' }, unread: 0 });
		await sleep(20);
		await rooms(b.db).insertOne({ _id: 'ops-b', name: 'ops', fname: 'ops', t: 'c', msgs: 0, _updatedAt: new Date() });
		await subscriptions(b.db).insertOne({ _id: 'sub-ops-b', rid: 'ops-b', name: 'draft', fname: 'draft', u: { _id: 'bob' }, unread: 0 });
		await subscriptions(b.db).updateOne({ _id: 'sub-ops-b' }, { $set: { name: 'ops', fname: 'ops', alert: true } });
		await heal();

		for (const site of [a, b]) {
			expect(await rooms(site.db).findOne({ _id: 'ops-a' })).toMatchObject({ name: 'ops' });
			expect(await rooms(site.db).findOne({ _id: 'ops-b' })).toMatchObject({ name: 'ops-B', fname: 'ops-B' });
			expect(await subscriptions(site.db).findOne({ _id: 'sub-ops-b' })).toMatchObject({ name: 'ops-B', fname: 'ops-B', alert: true });
		}
	});

	it("moves each side's messages into a thread when both sides posted in a room while disconnected", async () => {
		await rooms(a.db).insertOne({ _id: 'quiet', name: 'quiet', t: 'c', msgs: 0, _updatedAt: new Date() });
		await converged(a, b);
		await partition();
		await postMessage(a.db, 'a1', 'general', 'alice', 'A first');
		await postMessage(b.db, 'b1', 'general', 'bob', 'B first');
		await postMessage(a.db, 'a2', 'general', 'carol', 'A second');
		await postMessage(a.db, 'q1', 'quiet', 'alice', 'only A posted here');
		await heal();

		for (const site of [a, b]) {
			const byId = new Map((await messages(site.db).find({}).toArray()).map((message) => [message._id, message]));
			const anchorA = byId.get(byId.get('a1')?.tmid);
			const anchorB = byId.get(byId.get('b1')?.tmid);
			expect(anchorA).toMatchObject({ rid: 'general', tcount: 2, replies: ['alice', 'carol'], u: { username: 'rocket.cat' } });
			expect(anchorA?.msg).toContain('Site A');
			expect(anchorB).toMatchObject({ rid: 'general', tcount: 1, replies: ['bob'] });
			expect(anchorB?.msg).toContain('Site B');
			expect(byId.get('a2')?.tmid).toBe(anchorA?._id);
			expect(byId.get('q1')?.tmid).toBeUndefined();
		}
	});

	it('keeps messages inline after a disconnection shorter than the partition threshold', async () => {
		network.up = false;
		await postMessage(a.db, 'blip-a', 'general', 'alice', 'during a blip');
		await postMessage(b.db, 'blip-b', 'general', 'bob', 'during a blip too');
		await sleep(THRESHOLD_MS / 4);
		await heal();

		for (const site of [a, b]) {
			expect(await messages(site.db).countDocuments({ tmid: { $exists: true } })).toBe(0);
		}
	});

	it('catches up after a replicator restart without losing or repeating writes', async () => {
		await a.stop();
		await rooms(a.db).updateOne({ _id: 'general' }, { $inc: { msgs: 1 } });
		await postMessage(a.db, 'while-down', 'general', 'alice', 'written while the replicator was down');
		await rooms(b.db).updateOne({ _id: 'general' }, { $inc: { msgs: 10 } });
		await a.start();
		await converged(a, b);

		expect(await rooms(b.db).findOne({ _id: 'general' })).toMatchObject({ msgs: 12 });
		expect(await messages(b.db).findOne({ _id: 'while-down' })).not.toBeNull();
	});

	it('serves only one replicator per site', async () => {
		const [second] = await createSites(clients, a.db.databaseName, { up: true });
		await second.start();
		try {
			await waitFor(() => a.replicator.isLeader(), 5_000, 'first instance to lead');
			expect(second.replicator.isLeader()).toBe(false);
		} finally {
			await second.replicator.stop();
		}
	});
});
