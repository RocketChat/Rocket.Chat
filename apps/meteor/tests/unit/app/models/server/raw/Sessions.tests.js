import { expect } from 'chai';
import { MongoMemoryServer } from 'mongodb-memory-server';

const { MongoClient } = require('mongodb');

const { aggregates } = require('../../../../../../app/models/server/raw/Sessions');

const sessions_dates = [];
const baseDate = new Date(2018, 6, 1);

for (let index = 0; index < 365; index++) {
	sessions_dates.push({
		_id: `${baseDate.getFullYear()}-${baseDate.getMonth() + 1}-${baseDate.getDate()}`,
		year: baseDate.getFullYear(),
		month: baseDate.getMonth() + 1,
		day: baseDate.getDate(),
	});
	baseDate.setDate(baseDate.getDate() + 1);
}

const DATA = {
	sessions: [
		{
			_id: 'fNFyFcjszvoN6Grip2',
			day: 30,
			instanceId: 'HvbqxukP8E65LAGMY',
			month: 4,
			sessionId: 'kiA4xX33AyzPgpBNs2',
			year: 2019,
			_updatedAt: new Date('2019-04-30T16:33:24.311Z'),
			createdAt: new Date('2019-04-30T00:11:34.047Z'),
			device: {
				type: 'browser',
				name: 'Firefox',
				longVersion: '66.0.3',
				os: {
					name: 'Linux',
					version: '12',
				},
				version: '66.0.3',
			},
			host: 'localhost:3000',
			ip: '127.0.0.1',
			loginAt: new Date('2019-04-30T00:11:34.047Z'),
			type: 'session',
			userId: 'xPZXw9xqM3kKshsse',
			mostImportantRole: 'user',
			lastActivityAt: new Date('2019-04-30T00:16:20.349Z'),
			closedAt: new Date('2019-04-30T00:16:20.349Z'),
		},
		{
			_id: 'fNFyFcjszvoN6Grip',
			day: 2,
			instanceId: 'HvbqxukP8E65LAGMY',
			month: 5,
			sessionId: 'kiA4xX33AyzPgpBNs',
			year: 2019,
			_updatedAt: new Date('2019-05-06T16:33:24.311Z'),
			createdAt: new Date('2019-05-03T00:11:34.047Z'),
			device: {
				type: 'browser',
				name: 'Firefox',
				longVersion: '66.0.3',
				os: {
					name: 'Linux',
					version: '12',
				},
				version: '66.0.3',
			},
			host: 'localhost:3000',
			ip: '127.0.0.1',
			loginAt: new Date('2019-05-03T00:11:34.047Z'),
			type: 'session',
			userId: 'xPZXw9xqM3kKshsse',
			mostImportantRole: 'user',
			lastActivityAt: new Date('2019-05-03T00:16:20.349Z'),
			closedAt: new Date('2019-05-03T00:16:20.349Z'),
		},
		{
			_id: 'oZMkfR3gFB6kuKDK2',
			day: 2,
			instanceId: 'HvbqxukP8E65LAGMY',
			month: 5,
			sessionId: 'i8uJFekr9np4x88kS',
			year: 2019,
			_updatedAt: new Date('2019-05-06T16:33:24.311Z'),
			createdAt: new Date('2019-05-03T00:16:21.847Z'),
			device: {
				type: 'browser',
				name: 'Chrome',
				longVersion: '73.0.3683.103',
				os: {
					name: 'Mac OS',
					version: '10.14.1',
				},
				version: '73.0.3683',
			},
			host: 'localhost:3000',
			ip: '127.0.0.1',
			loginAt: new Date('2019-05-03T00:16:21.846Z'),
			type: 'session',
			userId: 'xPZXw9xqM3kKshsse',
			mostImportantRole: 'user',
			lastActivityAt: new Date('2019-05-03T00:17:21.081Z'),
			closedAt: new Date('2019-05-03T00:17:21.081Z'),
		},
		{
			_id: 'ABXKoXKTZpPpzLjKd',
			day: 2,
			instanceId: 'HvbqxukP8E65LAGMY',
			month: 5,
			sessionId: 'T8MB28cpx2ZjfEDXr',
			year: 2019,
			_updatedAt: new Date('2019-05-06T16:33:24.311Z'),
			createdAt: new Date('2019-05-03T00:17:22.375Z'),
			device: {
				type: 'browser',
				name: 'Chrome',
				longVersion: '73.0.3683.103',
				os: {
					name: 'Mac OS',
					version: '10.14.1',
				},
				version: '73.0.3683',
			},
			host: 'localhost:3000',
			ip: '127.0.0.1',
			loginAt: new Date('2019-05-03T00:17:22.375Z'),
			type: 'session',
			userId: 'xPZXw9xqM3kKshsse',
			mostImportantRole: 'user',
			lastActivityAt: new Date('2019-05-03T01:48:31.695Z'),
			closedAt: new Date('2019-05-03T01:48:31.695Z'),
		},
		{
			_id: 's4ucvvcfBjnTEtYEb',
			day: 2,
			instanceId: 'HvbqxukP8E65LAGMY',
			month: 5,
			sessionId: '8mHbJJypgeRG27TYF',
			year: 2019,
			_updatedAt: new Date('2019-05-06T16:33:24.311Z'),
			createdAt: new Date('2019-05-03T01:48:43.521Z'),
			device: {
				type: 'browser',
				name: 'Chrome',
				longVersion: '73.0.3683.103',
				os: {
					name: 'Mac OS',
					version: '10.14.1',
				},
				version: '73.0.3683',
			},
			host: 'localhost:3000',
			ip: '127.0.0.1',
			loginAt: new Date('2019-05-03T01:48:43.521Z'),
			type: 'session',
			userId: 'xPZXw9xqM3kKshsse',
			mostImportantRole: 'user',
			closedAt: new Date('2019-05-03T01:48:43.761Z'),
			lastActivityAt: new Date('2019-05-03T01:48:43.761Z'),
		},
		{
			_id: 'MDs9SzQKmwaDmXL8s',
			day: 2,
			instanceId: 'HvbqxukP8E65LAGMY',
			month: 5,
			sessionId: 'GmoBDPKy9RW2eXdCG',
			year: 2019,
			_updatedAt: new Date('2019-05-06T16:33:24.311Z'),
			createdAt: new Date('2019-05-03T01:48:45.064Z'),
			device: {
				type: 'browser',
				name: 'Chrome',
				longVersion: '73.0.3683.103',
				os: {
					name: 'Mac OS',
					version: '10.14.1',
				},
				version: '73.0.3683',
			},
			host: 'localhost:3000',
			ip: '127.0.0.1',
			loginAt: new Date('2019-05-03T01:48:45.064Z'),
			type: 'session',
			userId: 'xPZXw9xqM3kKshsse',
			mostImportantRole: 'user',
		},
		{
			_id: 'CJwfxASo62FHDgqog',
			day: 2,
			instanceId: 'Nmwo2ttFeWZSrowNh',
			month: 5,
			sessionId: 'LMrrL4sbpNMLWYomA',
			year: 2019,
			_updatedAt: new Date('2019-05-06T16:33:24.311Z'),
			createdAt: new Date('2019-05-03T01:50:31.098Z'),
			device: {
				type: 'browser',
				name: 'Chrome',
				longVersion: '73.0.3683.103',
				os: {
					name: 'Mac OS',
					version: '10.14.1',
				},
				version: '73.0.3683',
			},
			host: 'localhost:3000',
			ip: '127.0.0.1',
			loginAt: new Date('2019-05-03T01:50:31.092Z'),
			type: 'session',
			userId: 'xPZXw9xqM3kKshsse',
			mostImportantRole: 'user',
			closedAt: new Date('2019-05-03T01:50:31.355Z'),
			lastActivityAt: new Date('2019-05-03T01:50:31.355Z'),
		},
		{
			_id: 'iGAcPobWfTQtN6s4K',
			day: 1,
			instanceId: 'Nmwo2ttFeWZSrowNh',
			month: 5,
			sessionId: 'AsbjZRLNQMqfbyYFS',
			year: 2019,
			_updatedAt: new Date('2019-05-06T16:33:24.311Z'),
			createdAt: new Date('2019-05-03T01:50:32.765Z'),
			device: {
				type: 'browser',
				name: 'Chrome',
				longVersion: '73.0.3683.103',
				os: {
					name: 'Mac OS',
					version: '10.14.1',
				},
				version: '73.0.3683',
			},
			host: 'localhost:3000',
			ip: '127.0.0.1',
			loginAt: new Date('2019-05-03T01:50:32.765Z'),
			type: 'session',
			userId: 'xPZXw9xqM3kKshsse2',
			mostImportantRole: 'admin',
			lastActivityAt: new Date('2019-05-03T02:59:59.999Z'),
		},
	],
	sessions_dates,
};

describe('Sessions Aggregates', () => {
	let db;

	if (!process.env.MONGO_URL) {
		let mongod;
		before(async function () {
			this.timeout(120000);
			const version = '5.0.0';
			console.log(`Starting mongo version ${version}`);
			mongod = await MongoMemoryServer.create({ binary: { version } });
			process.env.MONGO_URL = await mongod.getUri();
		});

		after(async () => {
			await mongod.stop();
		});
	}

	before(async () => {
		console.log(`Connecting to mongo at ${process.env.MONGO_URL}`);
		const client = await MongoClient.connect(process.env.MONGO_URL, {
			useUnifiedTopology: true,
			useNewUrlParser: true,
		});
		db = client.db('test');

		after(() => {
			client.close();
		});

		await db.dropDatabase();

		const sessions = db.collection('sessions');
		const sessions_dates = db.collection('sessions_dates');

		return Promise.all([sessions.insertMany(DATA.sessions), sessions_dates.insertMany(DATA.sessions_dates)]);
	});

	it('should have sessions_dates data saved', () => {
		const collection = db.collection('sessions_dates');
		return collection
			.find()
			.toArray()
			.then((docs) => expect(docs.length).to.be.equal(DATA.sessions_dates.length));
	});

	it('should match sessions between 2018-12-11 and 2019-1-10', () => {
		const collection = db.collection('sessions_dates');
		const $match = aggregates.getMatchOfLastMonthOrWeek({ year: 2019, month: 1, day: 10 });

		expect($match).to.be.deep.equal({
			$and: [
				{
					$or: [{ year: { $gt: 2018 } }, { year: 2018, month: { $gt: 12 } }, { year: 2018, month: 12, day: { $gte: 11 } }],
				},
				{
					$or: [{ year: { $lt: 2019 } }, { year: 2019, month: { $lt: 1 } }, { year: 2019, month: 1, day: { $lte: 10 } }],
				},
			],
		});

		return collection
			.aggregate([
				{
					$match,
				},
			])
			.toArray()
			.then((docs) => {
				expect(docs.length).to.be.equal(31);
				expect(docs).to.be.deep.equal([
					{ _id: '2018-12-11', year: 2018, month: 12, day: 11 },
					{ _id: '2018-12-12', year: 2018, month: 12, day: 12 },
					{ _id: '2018-12-13', year: 2018, month: 12, day: 13 },
					{ _id: '2018-12-14', year: 2018, month: 12, day: 14 },
					{ _id: '2018-12-15', year: 2018, month: 12, day: 15 },
					{ _id: '2018-12-16', year: 2018, month: 12, day: 16 },
					{ _id: '2018-12-17', year: 2018, month: 12, day: 17 },
					{ _id: '2018-12-18', year: 2018, month: 12, day: 18 },
					{ _id: '2018-12-19', year: 2018, month: 12, day: 19 },
					{ _id: '2018-12-20', year: 2018, month: 12, day: 20 },
					{ _id: '2018-12-21', year: 2018, month: 12, day: 21 },
					{ _id: '2018-12-22', year: 2018, month: 12, day: 22 },
					{ _id: '2018-12-23', year: 2018, month: 12, day: 23 },
					{ _id: '2018-12-24', year: 2018, month: 12, day: 24 },
					{ _id: '2018-12-25', year: 2018, month: 12, day: 25 },
					{ _id: '2018-12-26', year: 2018, month: 12, day: 26 },
					{ _id: '2018-12-27', year: 2018, month: 12, day: 27 },
					{ _id: '2018-12-28', year: 2018, month: 12, day: 28 },
					{ _id: '2018-12-29', year: 2018, month: 12, day: 29 },
					{ _id: '2018-12-30', year: 2018, month: 12, day: 30 },
					{ _id: '2018-12-31', year: 2018, month: 12, day: 31 },
					{ _id: '2019-1-1', year: 2019, month: 1, day: 1 },
					{ _id: '2019-1-2', year: 2019, month: 1, day: 2 },
					{ _id: '2019-1-3', year: 2019, month: 1, day: 3 },
					{ _id: '2019-1-4', year: 2019, month: 1, day: 4 },
					{ _id: '2019-1-5', year: 2019, month: 1, day: 5 },
					{ _id: '2019-1-6', year: 2019, month: 1, day: 6 },
					{ _id: '2019-1-7', year: 2019, month: 1, day: 7 },
					{ _id: '2019-1-8', year: 2019, month: 1, day: 8 },
					{ _id: '2019-1-9', year: 2019, month: 1, day: 9 },
					{ _id: '2019-1-10', year: 2019, month: 1, day: 10 },
				]);
			});
	});

	it('should match sessions between 2019-1-11 and 2019-2-10', () => {
		const collection = db.collection('sessions_dates');
		const $match = aggregates.getMatchOfLastMonthOrWeek({ year: 2019, month: 2, day: 10 });

		expect($match).to.be.deep.equal({
			year: 2019,
			$and: [
				{
					$or: [{ month: { $gt: 1 } }, { month: 1, day: { $gte: 11 } }],
				},
				{
					$or: [{ month: { $lt: 2 } }, { month: 2, day: { $lte: 10 } }],
				},
			],
		});

		return collection
			.aggregate([
				{
					$match,
				},
			])
			.toArray()
			.then((docs) => {
				expect(docs.length).to.be.deep.equal(31);
				expect(docs).to.be.deep.equal([
					{ _id: '2019-1-11', year: 2019, month: 1, day: 11 },
					{ _id: '2019-1-12', year: 2019, month: 1, day: 12 },
					{ _id: '2019-1-13', year: 2019, month: 1, day: 13 },
					{ _id: '2019-1-14', year: 2019, month: 1, day: 14 },
					{ _id: '2019-1-15', year: 2019, month: 1, day: 15 },
					{ _id: '2019-1-16', year: 2019, month: 1, day: 16 },
					{ _id: '2019-1-17', year: 2019, month: 1, day: 17 },
					{ _id: '2019-1-18', year: 2019, month: 1, day: 18 },
					{ _id: '2019-1-19', year: 2019, month: 1, day: 19 },
					{ _id: '2019-1-20', year: 2019, month: 1, day: 20 },
					{ _id: '2019-1-21', year: 2019, month: 1, day: 21 },
					{ _id: '2019-1-22', year: 2019, month: 1, day: 22 },
					{ _id: '2019-1-23', year: 2019, month: 1, day: 23 },
					{ _id: '2019-1-24', year: 2019, month: 1, day: 24 },
					{ _id: '2019-1-25', year: 2019, month: 1, day: 25 },
					{ _id: '2019-1-26', year: 2019, month: 1, day: 26 },
					{ _id: '2019-1-27', year: 2019, month: 1, day: 27 },
					{ _id: '2019-1-28', year: 2019, month: 1, day: 28 },
					{ _id: '2019-1-29', year: 2019, month: 1, day: 29 },
					{ _id: '2019-1-30', year: 2019, month: 1, day: 30 },
					{ _id: '2019-1-31', year: 2019, month: 1, day: 31 },
					{ _id: '2019-2-1', year: 2019, month: 2, day: 1 },
					{ _id: '2019-2-2', year: 2019, month: 2, day: 2 },
					{ _id: '2019-2-3', year: 2019, month: 2, day: 3 },
					{ _id: '2019-2-4', year: 2019, month: 2, day: 4 },
					{ _id: '2019-2-5', year: 2019, month: 2, day: 5 },
					{ _id: '2019-2-6', year: 2019, month: 2, day: 6 },
					{ _id: '2019-2-7', year: 2019, month: 2, day: 7 },
					{ _id: '2019-2-8', year: 2019, month: 2, day: 8 },
					{ _id: '2019-2-9', year: 2019, month: 2, day: 9 },
					{ _id: '2019-2-10', year: 2019, month: 2, day: 10 },
				]);
			});
	});

	it('should match sessions between 2019-5-1 and 2019-5-31', () => {
		const collection = db.collection('sessions_dates');
		const $match = aggregates.getMatchOfLastMonthOrWeek({ year: 2019, month: 5, day: 31 });

		expect($match).to.be.deep.equal({
			year: 2019,
			month: 5,
			day: { $gte: 1, $lte: 31 },
		});

		return collection
			.aggregate([
				{
					$match,
				},
			])
			.toArray()
			.then((docs) => {
				expect(docs.length).to.be.equal(31);
				expect(docs).to.be.deep.equal([
					{ _id: '2019-5-1', year: 2019, month: 5, day: 1 },
					{ _id: '2019-5-2', year: 2019, month: 5, day: 2 },
					{ _id: '2019-5-3', year: 2019, month: 5, day: 3 },
					{ _id: '2019-5-4', year: 2019, month: 5, day: 4 },
					{ _id: '2019-5-5', year: 2019, month: 5, day: 5 },
					{ _id: '2019-5-6', year: 2019, month: 5, day: 6 },
					{ _id: '2019-5-7', year: 2019, month: 5, day: 7 },
					{ _id: '2019-5-8', year: 2019, month: 5, day: 8 },
					{ _id: '2019-5-9', year: 2019, month: 5, day: 9 },
					{ _id: '2019-5-10', year: 2019, month: 5, day: 10 },
					{ _id: '2019-5-11', year: 2019, month: 5, day: 11 },
					{ _id: '2019-5-12', year: 2019, month: 5, day: 12 },
					{ _id: '2019-5-13', year: 2019, month: 5, day: 13 },
					{ _id: '2019-5-14', year: 2019, month: 5, day: 14 },
					{ _id: '2019-5-15', year: 2019, month: 5, day: 15 },
					{ _id: '2019-5-16', year: 2019, month: 5, day: 16 },
					{ _id: '2019-5-17', year: 2019, month: 5, day: 17 },
					{ _id: '2019-5-18', year: 2019, month: 5, day: 18 },
					{ _id: '2019-5-19', year: 2019, month: 5, day: 19 },
					{ _id: '2019-5-20', year: 2019, month: 5, day: 20 },
					{ _id: '2019-5-21', year: 2019, month: 5, day: 21 },
					{ _id: '2019-5-22', year: 2019, month: 5, day: 22 },
					{ _id: '2019-5-23', year: 2019, month: 5, day: 23 },
					{ _id: '2019-5-24', year: 2019, month: 5, day: 24 },
					{ _id: '2019-5-25', year: 2019, month: 5, day: 25 },
					{ _id: '2019-5-26', year: 2019, month: 5, day: 26 },
					{ _id: '2019-5-27', year: 2019, month: 5, day: 27 },
					{ _id: '2019-5-28', year: 2019, month: 5, day: 28 },
					{ _id: '2019-5-29', year: 2019, month: 5, day: 29 },
					{ _id: '2019-5-30', year: 2019, month: 5, day: 30 },
					{ _id: '2019-5-31', year: 2019, month: 5, day: 31 },
				]);
			});
	});

	it('should match sessions between 2019-4-1 and 2019-4-30', () => {
		const collection = db.collection('sessions_dates');
		const $match = aggregates.getMatchOfLastMonthOrWeek({ year: 2019, month: 4, day: 30 });

		expect($match).to.be.deep.equal({
			year: 2019,
			month: 4,
			day: { $gte: 1, $lte: 30 },
		});

		return collection
			.aggregate([
				{
					$match,
				},
			])
			.toArray()
			.then((docs) => {
				expect(docs.length).to.be.equal(30);
				expect(docs).to.be.deep.equal([
					{ _id: '2019-4-1', year: 2019, month: 4, day: 1 },
					{ _id: '2019-4-2', year: 2019, month: 4, day: 2 },
					{ _id: '2019-4-3', year: 2019, month: 4, day: 3 },
					{ _id: '2019-4-4', year: 2019, month: 4, day: 4 },
					{ _id: '2019-4-5', year: 2019, month: 4, day: 5 },
					{ _id: '2019-4-6', year: 2019, month: 4, day: 6 },
					{ _id: '2019-4-7', year: 2019, month: 4, day: 7 },
					{ _id: '2019-4-8', year: 2019, month: 4, day: 8 },
					{ _id: '2019-4-9', year: 2019, month: 4, day: 9 },
					{ _id: '2019-4-10', year: 2019, month: 4, day: 10 },
					{ _id: '2019-4-11', year: 2019, month: 4, day: 11 },
					{ _id: '2019-4-12', year: 2019, month: 4, day: 12 },
					{ _id: '2019-4-13', year: 2019, month: 4, day: 13 },
					{ _id: '2019-4-14', year: 2019, month: 4, day: 14 },
					{ _id: '2019-4-15', year: 2019, month: 4, day: 15 },
					{ _id: '2019-4-16', year: 2019, month: 4, day: 16 },
					{ _id: '2019-4-17', year: 2019, month: 4, day: 17 },
					{ _id: '2019-4-18', year: 2019, month: 4, day: 18 },
					{ _id: '2019-4-19', year: 2019, month: 4, day: 19 },
					{ _id: '2019-4-20', year: 2019, month: 4, day: 20 },
					{ _id: '2019-4-21', year: 2019, month: 4, day: 21 },
					{ _id: '2019-4-22', year: 2019, month: 4, day: 22 },
					{ _id: '2019-4-23', year: 2019, month: 4, day: 23 },
					{ _id: '2019-4-24', year: 2019, month: 4, day: 24 },
					{ _id: '2019-4-25', year: 2019, month: 4, day: 25 },
					{ _id: '2019-4-26', year: 2019, month: 4, day: 26 },
					{ _id: '2019-4-27', year: 2019, month: 4, day: 27 },
					{ _id: '2019-4-28', year: 2019, month: 4, day: 28 },
					{ _id: '2019-4-29', year: 2019, month: 4, day: 29 },
					{ _id: '2019-4-30', year: 2019, month: 4, day: 30 },
				]);
			});
	});

	it('should match sessions between 2019-2-1 and 2019-2-28', () => {
		const collection = db.collection('sessions_dates');
		const $match = aggregates.getMatchOfLastMonthOrWeek({ year: 2019, month: 2, day: 28 });

		expect($match).to.be.deep.equal({
			year: 2019,
			month: 2,
			day: { $gte: 1, $lte: 28 },
		});

		return collection
			.aggregate([
				{
					$match,
				},
			])
			.toArray()
			.then((docs) => {
				expect(docs.length).to.be.equal(28);
				expect(docs).to.be.deep.equal([
					{ _id: '2019-2-1', year: 2019, month: 2, day: 1 },
					{ _id: '2019-2-2', year: 2019, month: 2, day: 2 },
					{ _id: '2019-2-3', year: 2019, month: 2, day: 3 },
					{ _id: '2019-2-4', year: 2019, month: 2, day: 4 },
					{ _id: '2019-2-5', year: 2019, month: 2, day: 5 },
					{ _id: '2019-2-6', year: 2019, month: 2, day: 6 },
					{ _id: '2019-2-7', year: 2019, month: 2, day: 7 },
					{ _id: '2019-2-8', year: 2019, month: 2, day: 8 },
					{ _id: '2019-2-9', year: 2019, month: 2, day: 9 },
					{ _id: '2019-2-10', year: 2019, month: 2, day: 10 },
					{ _id: '2019-2-11', year: 2019, month: 2, day: 11 },
					{ _id: '2019-2-12', year: 2019, month: 2, day: 12 },
					{ _id: '2019-2-13', year: 2019, month: 2, day: 13 },
					{ _id: '2019-2-14', year: 2019, month: 2, day: 14 },
					{ _id: '2019-2-15', year: 2019, month: 2, day: 15 },
					{ _id: '2019-2-16', year: 2019, month: 2, day: 16 },
					{ _id: '2019-2-17', year: 2019, month: 2, day: 17 },
					{ _id: '2019-2-18', year: 2019, month: 2, day: 18 },
					{ _id: '2019-2-19', year: 2019, month: 2, day: 19 },
					{ _id: '2019-2-20', year: 2019, month: 2, day: 20 },
					{ _id: '2019-2-21', year: 2019, month: 2, day: 21 },
					{ _id: '2019-2-22', year: 2019, month: 2, day: 22 },
					{ _id: '2019-2-23', year: 2019, month: 2, day: 23 },
					{ _id: '2019-2-24', year: 2019, month: 2, day: 24 },
					{ _id: '2019-2-25', year: 2019, month: 2, day: 25 },
					{ _id: '2019-2-26', year: 2019, month: 2, day: 26 },
					{ _id: '2019-2-27', year: 2019, month: 2, day: 27 },
					{ _id: '2019-2-28', year: 2019, month: 2, day: 28 },
				]);
			});
	});

	it('should match sessions between 2019-1-28 and 2019-2-27', () => {
		const collection = db.collection('sessions_dates');
		const $match = aggregates.getMatchOfLastMonthOrWeek({ year: 2019, month: 2, day: 27 });

		expect($match).to.be.deep.equal({
			year: 2019,
			$and: [
				{
					$or: [{ month: { $gt: 1 } }, { month: 1, day: { $gte: 28 } }],
				},
				{
					$or: [{ month: { $lt: 2 } }, { month: 2, day: { $lte: 27 } }],
				},
			],
		});

		return collection
			.aggregate([
				{
					$match,
				},
			])
			.toArray()
			.then((docs) => {
				expect(docs.length).to.be.equal(31);
				expect(docs).to.be.deep.equal([
					{ _id: '2019-1-28', year: 2019, month: 1, day: 28 },
					{ _id: '2019-1-29', year: 2019, month: 1, day: 29 },
					{ _id: '2019-1-30', year: 2019, month: 1, day: 30 },
					{ _id: '2019-1-31', year: 2019, month: 1, day: 31 },
					{ _id: '2019-2-1', year: 2019, month: 2, day: 1 },
					{ _id: '2019-2-2', year: 2019, month: 2, day: 2 },
					{ _id: '2019-2-3', year: 2019, month: 2, day: 3 },
					{ _id: '2019-2-4', year: 2019, month: 2, day: 4 },
					{ _id: '2019-2-5', year: 2019, month: 2, day: 5 },
					{ _id: '2019-2-6', year: 2019, month: 2, day: 6 },
					{ _id: '2019-2-7', year: 2019, month: 2, day: 7 },
					{ _id: '2019-2-8', year: 2019, month: 2, day: 8 },
					{ _id: '2019-2-9', year: 2019, month: 2, day: 9 },
					{ _id: '2019-2-10', year: 2019, month: 2, day: 10 },
					{ _id: '2019-2-11', year: 2019, month: 2, day: 11 },
					{ _id: '2019-2-12', year: 2019, month: 2, day: 12 },
					{ _id: '2019-2-13', year: 2019, month: 2, day: 13 },
					{ _id: '2019-2-14', year: 2019, month: 2, day: 14 },
					{ _id: '2019-2-15', year: 2019, month: 2, day: 15 },
					{ _id: '2019-2-16', year: 2019, month: 2, day: 16 },
					{ _id: '2019-2-17', year: 2019, month: 2, day: 17 },
					{ _id: '2019-2-18', year: 2019, month: 2, day: 18 },
					{ _id: '2019-2-19', year: 2019, month: 2, day: 19 },
					{ _id: '2019-2-20', year: 2019, month: 2, day: 20 },
					{ _id: '2019-2-21', year: 2019, month: 2, day: 21 },
					{ _id: '2019-2-22', year: 2019, month: 2, day: 22 },
					{ _id: '2019-2-23', year: 2019, month: 2, day: 23 },
					{ _id: '2019-2-24', year: 2019, month: 2, day: 24 },
					{ _id: '2019-2-25', year: 2019, month: 2, day: 25 },
					{ _id: '2019-2-26', year: 2019, month: 2, day: 26 },
					{ _id: '2019-2-27', year: 2019, month: 2, day: 27 },
				]);
			});
	});

	it('should have sessions data saved', () => {
		const collection = db.collection('sessions');
		return collection
			.find()
			.toArray()
			.then((docs) => expect(docs.length).to.be.equal(DATA.sessions.length));
	});

	it('should generate daily sessions', () => {
		const collection = db.collection('sessions');
		return aggregates
			.dailySessionsOfYesterday(collection, { year: 2019, month: 5, day: 2 })
			.toArray()
			.then(async (docs) => {
				docs.forEach((doc) => {
					doc._id = `${doc.userId}-${doc.year}-${doc.month}-${doc.day}`;
				});

				await collection.insertMany(docs);

				expect(docs.length).to.be.equal(3);
				expect(docs).to.be.deep.equal([
					{
						_id: 'xPZXw9xqM3kKshsse-2019-5-2',
						time: 5814,
						sessions: 3,
						devices: [
							{
								sessions: 2,
								time: 5528,
								device: {
									type: 'browser',
									name: 'Chrome',
									longVersion: '73.0.3683.103',
									os: {
										name: 'Mac OS',
										version: '10.14.1',
									},
									version: '73.0.3683',
								},
							},
							{
								sessions: 1,
								time: 286,
								device: {
									type: 'browser',
									name: 'Firefox',
									longVersion: '66.0.3',
									os: {
										name: 'Linux',
										version: '12',
									},
									version: '66.0.3',
								},
							},
						],
						type: 'user_daily',
						_computedAt: docs[0]._computedAt,
						day: 2,
						month: 5,
						year: 2019,
						userId: 'xPZXw9xqM3kKshsse',
						mostImportantRole: 'user',
					},
					{
						_id: 'xPZXw9xqM3kKshsse-2019-4-30',
						day: 30,
						devices: [
							{
								device: {
									longVersion: '66.0.3',
									name: 'Firefox',
									os: {
										name: 'Linux',
										version: '12',
									},
									type: 'browser',
									version: '66.0.3',
								},
								sessions: 1,
								time: 286,
							},
						],
						month: 4,
						sessions: 1,
						time: 286,
						type: 'user_daily',
						_computedAt: docs[1]._computedAt,
						userId: 'xPZXw9xqM3kKshsse',
						mostImportantRole: 'user',
						year: 2019,
					},
					{
						_id: 'xPZXw9xqM3kKshsse2-2019-5-1',
						time: 4167,
						sessions: 1,
						devices: [
							{
								sessions: 1,
								time: 4167,
								device: {
									type: 'browser',
									name: 'Chrome',
									longVersion: '73.0.3683.103',
									os: {
										name: 'Mac OS',
										version: '10.14.1',
									},
									version: '73.0.3683',
								},
							},
						],
						type: 'user_daily',
						_computedAt: docs[2]._computedAt,
						day: 1,
						month: 5,
						year: 2019,
						userId: 'xPZXw9xqM3kKshsse2',
						mostImportantRole: 'admin',
					},
				]);
			});
	});

	it('should have 2 unique users for month 5 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueUsersOfLastMonthOrWeek(collection, { year: 2019, month: 5, day: 31 }).then((docs) => {
			expect(docs.length).to.be.equal(1);
			expect(docs).to.be.deep.equal([
				{
					count: 2,
					roles: [
						{
							count: 1,
							role: 'user',
							sessions: 3,
							time: 5814,
						},
						{
							count: 1,
							role: 'admin',
							sessions: 1,
							time: 4167,
						},
					],
					sessions: 4,
					time: 9981,
				},
			]);
		});
	});

	it('should have 1 unique user for 1st of month 5 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueUsersOfYesterday(collection, { year: 2019, month: 5, day: 1 }).then((docs) => {
			expect(docs.length).to.be.equal(1);
			expect(docs).to.be.deep.equal([
				{
					count: 1,
					roles: [
						{
							count: 1,
							role: 'admin',
							sessions: 1,
							time: 4167,
						},
					],
					sessions: 1,
					time: 4167,
				},
			]);
		});
	});

	it('should have 1 unique user for 2nd of month 5 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueUsersOfYesterday(collection, { year: 2019, month: 5, day: 2 }).then((docs) => {
			expect(docs.length).to.be.equal(1);
			expect(docs).to.be.deep.equal([
				{
					count: 1,
					roles: [
						{
							count: 1,
							role: 'user',
							sessions: 3,
							time: 5814,
						},
					],
					sessions: 3,
					time: 5814,
				},
			]);
		});
	});

	it('should have 2 unique devices for month 5 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueDevicesOfLastMonthOrWeek(collection, { year: 2019, month: 5, day: 31 }).then((docs) => {
			expect(docs.length).to.be.equal(2);
			expect(docs).to.be.deep.equal([
				{
					count: 3,
					time: 9695,
					type: 'browser',
					name: 'Chrome',
					version: '73.0.3683',
				},
				{
					count: 1,
					time: 286,
					type: 'browser',
					name: 'Firefox',
					version: '66.0.3',
				},
			]);
		});
	});

	it('should have 2 unique devices for 2nd of month 5 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueDevicesOfYesterday(collection, { year: 2019, month: 5, day: 2 }).then((docs) => {
			expect(docs.length).to.be.equal(2);
			expect(docs).to.be.deep.equal([
				{
					count: 2,
					time: 5528,
					type: 'browser',
					name: 'Chrome',
					version: '73.0.3683',
				},
				{
					count: 1,
					time: 286,
					type: 'browser',
					name: 'Firefox',
					version: '66.0.3',
				},
			]);
		});
	});

	it('should have 2 unique OS for month 5 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueOSOfLastMonthOrWeek(collection, { year: 2019, month: 5, day: 31 }).then((docs) => {
			expect(docs.length).to.be.equal(2);
			expect(docs).to.be.deep.equal([
				{
					count: 3,
					time: 9695,
					name: 'Mac OS',
					version: '10.14.1',
				},
				{
					count: 1,
					time: 286,
					name: 'Linux',
					version: '12',
				},
			]);
		});
	});

	it('should have 2 unique OS for 2nd of month 5 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueOSOfYesterday(collection, { year: 2019, month: 5, day: 2 }).then((docs) => {
			expect(docs.length).to.be.equal(2);
			expect(docs).to.be.deep.equal([
				{
					count: 2,
					time: 5528,
					name: 'Mac OS',
					version: '10.14.1',
				},
				{
					count: 1,
					time: 286,
					name: 'Linux',
					version: '12',
				},
			]);
		});
	});

	it('should match sessions between 2018-12-29 and 2019-1-4', () => {
		const collection = db.collection('sessions_dates');
		const $match = aggregates.getMatchOfLastMonthOrWeek({
			year: 2019,
			month: 1,
			day: 4,
			type: 'week',
		});

		expect($match).to.be.deep.equal({
			$and: [
				{
					$or: [{ year: { $gt: 2018 } }, { year: 2018, month: { $gt: 12 } }, { year: 2018, month: 12, day: { $gte: 29 } }],
				},
				{
					$or: [{ year: { $lt: 2019 } }, { year: 2019, month: { $lt: 1 } }, { year: 2019, month: 1, day: { $lte: 4 } }],
				},
			],
		});

		return collection
			.aggregate([
				{
					$match,
				},
			])
			.toArray()
			.then((docs) => {
				expect(docs.length).to.be.equal(7);
				expect(docs).to.be.deep.equal([
					{ _id: '2018-12-29', year: 2018, month: 12, day: 29 },
					{ _id: '2018-12-30', year: 2018, month: 12, day: 30 },
					{ _id: '2018-12-31', year: 2018, month: 12, day: 31 },
					{ _id: '2019-1-1', year: 2019, month: 1, day: 1 },
					{ _id: '2019-1-2', year: 2019, month: 1, day: 2 },
					{ _id: '2019-1-3', year: 2019, month: 1, day: 3 },
					{ _id: '2019-1-4', year: 2019, month: 1, day: 4 },
				]);
			});
	});

	it('should match sessions between 2019-1-29 and 2019-2-4', () => {
		const collection = db.collection('sessions_dates');
		const $match = aggregates.getMatchOfLastMonthOrWeek({
			year: 2019,
			month: 2,
			day: 4,
			type: 'week',
		});

		expect($match).to.be.deep.equal({
			year: 2019,
			$and: [
				{
					$or: [{ month: { $gt: 1 } }, { month: 1, day: { $gte: 29 } }],
				},
				{
					$or: [{ month: { $lt: 2 } }, { month: 2, day: { $lte: 4 } }],
				},
			],
		});

		return collection
			.aggregate([
				{
					$match,
				},
			])
			.toArray()
			.then((docs) => {
				expect(docs.length).to.be.equal(7);
				expect(docs).to.be.deep.equal([
					{ _id: '2019-1-29', year: 2019, month: 1, day: 29 },
					{ _id: '2019-1-30', year: 2019, month: 1, day: 30 },
					{ _id: '2019-1-31', year: 2019, month: 1, day: 31 },
					{ _id: '2019-2-1', year: 2019, month: 2, day: 1 },
					{ _id: '2019-2-2', year: 2019, month: 2, day: 2 },
					{ _id: '2019-2-3', year: 2019, month: 2, day: 3 },
					{ _id: '2019-2-4', year: 2019, month: 2, day: 4 },
				]);
			});
	});

	it('should match sessions between 2019-5-1 and 2019-5-7', () => {
		const collection = db.collection('sessions_dates');
		const $match = aggregates.getMatchOfLastMonthOrWeek({
			year: 2019,
			month: 5,
			day: 7,
			type: 'week',
		});

		expect($match).to.be.deep.equal({
			year: 2019,
			month: 5,
			day: { $gte: 1, $lte: 7 },
		});

		return collection
			.aggregate([
				{
					$match,
				},
			])
			.toArray()
			.then((docs) => {
				expect(docs.length).to.be.equal(7);
				expect(docs).to.be.deep.equal([
					{ _id: '2019-5-1', year: 2019, month: 5, day: 1 },
					{ _id: '2019-5-2', year: 2019, month: 5, day: 2 },
					{ _id: '2019-5-3', year: 2019, month: 5, day: 3 },
					{ _id: '2019-5-4', year: 2019, month: 5, day: 4 },
					{ _id: '2019-5-5', year: 2019, month: 5, day: 5 },
					{ _id: '2019-5-6', year: 2019, month: 5, day: 6 },
					{ _id: '2019-5-7', year: 2019, month: 5, day: 7 },
				]);
			});
	});

	it('should match sessions between 2019-5-7 and 2019-5-14', () => {
		const collection = db.collection('sessions_dates');
		const $match = aggregates.getMatchOfLastMonthOrWeek({
			year: 2019,
			month: 5,
			day: 14,
			type: 'week',
		});

		expect($match).to.be.deep.equal({
			year: 2019,
			month: 5,
			day: { $gte: 8, $lte: 14 },
		});

		return collection
			.aggregate([
				{
					$match,
				},
			])
			.toArray()
			.then((docs) => {
				expect(docs.length).to.be.equal(7);
				expect(docs).to.be.deep.equal([
					{ _id: '2019-5-8', year: 2019, month: 5, day: 8 },
					{ _id: '2019-5-9', year: 2019, month: 5, day: 9 },
					{ _id: '2019-5-10', year: 2019, month: 5, day: 10 },
					{ _id: '2019-5-11', year: 2019, month: 5, day: 11 },
					{ _id: '2019-5-12', year: 2019, month: 5, day: 12 },
					{ _id: '2019-5-13', year: 2019, month: 5, day: 13 },
					{ _id: '2019-5-14', year: 2019, month: 5, day: 14 },
				]);
			});
	});

	it('should have 0 unique users for the week ending on 5/31 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueUsersOfLastMonthOrWeek(collection, { year: 2019, month: 5, day: 31, type: 'week' }).then((docs) => {
			expect(docs.length).to.be.equal(0);
		});
	});

	it('should have 2 unique users for the week ending on 5/7 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueUsersOfLastMonthOrWeek(collection, { year: 2019, month: 5, day: 7, type: 'week' }).then((docs) => {
			expect(docs.length).to.be.equal(1);
			expect(docs).to.be.deep.equal([
				{
					count: 2,
					roles: [
						{
							count: 1,
							role: 'user',
							sessions: 3,
							time: 5814,
						},
						{
							count: 1,
							role: 'admin',
							sessions: 1,
							time: 4167,
						},
					],
					sessions: 4,
					time: 9981,
				},
			]);
		});
	});

	it('should have 2 unique devices for the week ending on 5/7 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueDevicesOfLastMonthOrWeek(collection, { year: 2019, month: 5, day: 7, type: 'week' }).then((docs) => {
			expect(docs.length).to.be.equal(2);
			expect(docs).to.be.deep.equal([
				{
					count: 3,
					time: 9695,
					type: 'browser',
					name: 'Chrome',
					version: '73.0.3683',
				},
				{
					count: 1,
					time: 286,
					type: 'browser',
					name: 'Firefox',
					version: '66.0.3',
				},
			]);
		});
	});

	it('should have 2 unique OS for the week ending on 5/7 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueOSOfLastMonthOrWeek(collection, { year: 2019, month: 5, day: 7 }).then((docs) => {
			expect(docs.length).to.be.equal(2);
			expect(docs).to.be.deep.equal([
				{
					count: 3,
					time: 9695,
					name: 'Mac OS',
					version: '10.14.1',
				},
				{
					count: 2,
					time: 572,
					name: 'Linux',
					version: '12',
				},
			]);
		});
	});
});
