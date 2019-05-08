/* eslint-env mocha */

import assert from 'assert';
import './Sessions.mocks.js';
const mongoUnit = require('mongo-unit');
const { MongoClient } = require('mongodb');
const { aggregates } = require('./Sessions');

const DATA = {
	sessions: [{
		_id : 'fNFyFcjszvoN6Grip',
		day : 2,
		instanceId : 'HvbqxukP8E65LAGMY',
		month : 5,
		sessionId : 'kiA4xX33AyzPgpBNs',
		year : 2019,
		_updatedAt : new Date('2019-05-06T16:33:24.311Z'),
		createdAt : new Date('2019-05-03T00:11:34.047Z'),
		device : {
			type : 'browser',
			name : 'Firefox',
			longVersion : '66.0.3',
			os : {
				name : 'Linux',
				version : '12',
			},
			version : '66.0.3',
		},
		host : 'localhost:3000',
		ip : '127.0.0.1',
		loginAt : new Date('2019-05-03T00:11:34.047Z'),
		type : 'session',
		userId : 'xPZXw9xqM3kKshsse',
		lastActivityAt : new Date('2019-05-03T00:16:20.349Z'),
		closedAt : new Date('2019-05-03T00:16:20.349Z'),
	}, {
		_id : 'oZMkfR3gFB6kuKDK2',
		day : 2,
		instanceId : 'HvbqxukP8E65LAGMY',
		month : 5,
		sessionId : 'i8uJFekr9np4x88kS',
		year : 2019,
		_updatedAt : new Date('2019-05-06T16:33:24.311Z'),
		createdAt : new Date('2019-05-03T00:16:21.847Z'),
		device : {
			type : 'browser',
			name : 'Chrome',
			longVersion : '73.0.3683.103',
			os : {
				name : 'Mac OS',
				version : '10.14.1',
			},
			version : '73.0.3683',
		},
		host : 'localhost:3000',
		ip : '127.0.0.1',
		loginAt : new Date('2019-05-03T00:16:21.846Z'),
		type : 'session',
		userId : 'xPZXw9xqM3kKshsse',
		lastActivityAt : new Date('2019-05-03T00:17:21.081Z'),
		closedAt : new Date('2019-05-03T00:17:21.081Z'),
	}, {
		_id : 'ABXKoXKTZpPpzLjKd',
		day : 2,
		instanceId : 'HvbqxukP8E65LAGMY',
		month : 5,
		sessionId : 'T8MB28cpx2ZjfEDXr',
		year : 2019,
		_updatedAt : new Date('2019-05-06T16:33:24.311Z'),
		createdAt : new Date('2019-05-03T00:17:22.375Z'),
		device : {
			type : 'browser',
			name : 'Chrome',
			longVersion : '73.0.3683.103',
			os : {
				name : 'Mac OS',
				version : '10.14.1',
			},
			version : '73.0.3683',
		},
		host : 'localhost:3000',
		ip : '127.0.0.1',
		loginAt : new Date('2019-05-03T00:17:22.375Z'),
		type : 'session',
		userId : 'xPZXw9xqM3kKshsse',
		lastActivityAt : new Date('2019-05-03T01:48:31.695Z'),
		closedAt : new Date('2019-05-03T01:48:31.695Z'),
	}, {
		_id : 's4ucvvcfBjnTEtYEb',
		day : 2,
		instanceId : 'HvbqxukP8E65LAGMY',
		month : 5,
		sessionId : '8mHbJJypgeRG27TYF',
		year : 2019,
		_updatedAt : new Date('2019-05-06T16:33:24.311Z'),
		createdAt : new Date('2019-05-03T01:48:43.521Z'),
		device : {
			type : 'browser',
			name : 'Chrome',
			longVersion : '73.0.3683.103',
			os : {
				name : 'Mac OS',
				version : '10.14.1',
			},
			version : '73.0.3683',
		},
		host : 'localhost:3000',
		ip : '127.0.0.1',
		loginAt : new Date('2019-05-03T01:48:43.521Z'),
		type : 'session',
		userId : 'xPZXw9xqM3kKshsse',
		closedAt : new Date('2019-05-03T01:48:43.761Z'),
		lastActivityAt : new Date('2019-05-03T01:48:43.761Z'),
	}, {
		_id : 'MDs9SzQKmwaDmXL8s',
		day : 2,
		instanceId : 'HvbqxukP8E65LAGMY',
		month : 5,
		sessionId : 'GmoBDPKy9RW2eXdCG',
		year : 2019,
		_updatedAt : new Date('2019-05-06T16:33:24.311Z'),
		createdAt : new Date('2019-05-03T01:48:45.064Z'),
		device : {
			type : 'browser',
			name : 'Chrome',
			longVersion : '73.0.3683.103',
			os : {
				name : 'Mac OS',
				version : '10.14.1',
			},
			version : '73.0.3683',
		},
		host : 'localhost:3000',
		ip : '127.0.0.1',
		loginAt : new Date('2019-05-03T01:48:45.064Z'),
		type : 'session',
		userId : 'xPZXw9xqM3kKshsse',
	}, {
		_id : 'CJwfxASo62FHDgqog',
		day : 2,
		instanceId : 'Nmwo2ttFeWZSrowNh',
		month : 5,
		sessionId : 'LMrrL4sbpNMLWYomA',
		year : 2019,
		_updatedAt : new Date('2019-05-06T16:33:24.311Z'),
		createdAt : new Date('2019-05-03T01:50:31.098Z'),
		device : {
			type : 'browser',
			name : 'Chrome',
			longVersion : '73.0.3683.103',
			os : {
				name : 'Mac OS',
				version : '10.14.1',
			},
			version : '73.0.3683',
		},
		host : 'localhost:3000',
		ip : '127.0.0.1',
		loginAt : new Date('2019-05-03T01:50:31.092Z'),
		type : 'session',
		userId : 'xPZXw9xqM3kKshsse',
		closedAt : new Date('2019-05-03T01:50:31.355Z'),
		lastActivityAt : new Date('2019-05-03T01:50:31.355Z'),
	}, {
		_id : 'iGAcPobWfTQtN6s4K',
		day : 1,
		instanceId : 'Nmwo2ttFeWZSrowNh',
		month : 5,
		sessionId : 'AsbjZRLNQMqfbyYFS',
		year : 2019,
		_updatedAt : new Date('2019-05-06T16:33:24.311Z'),
		createdAt : new Date('2019-05-03T01:50:32.765Z'),
		device : {
			type : 'browser',
			name : 'Chrome',
			longVersion : '73.0.3683.103',
			os : {
				name : 'Mac OS',
				version : '10.14.1',
			},
			version : '73.0.3683',
		},
		host : 'localhost:3000',
		ip : '127.0.0.1',
		loginAt : new Date('2019-05-03T01:50:32.765Z'),
		type : 'session',
		userId : 'xPZXw9xqM3kKshsse2',
		lastActivityAt : new Date('2019-05-03T02:59:59.999Z'),
	}],
}; // require('./fixtures/testData.json')

describe('Sessions Aggregates', () => {
	let db;

	if (!process.env.MONGO_URL) {
		before(function() {
			this.timeout(120000);
			return mongoUnit.start({ version: '3.2.22' })
				.then((testMongoUrl) => process.env.MONGO_URL = testMongoUrl);
		});

		after(() => { mongoUnit.stop(); });
	}

	before(function() {
		return MongoClient.connect(process.env.MONGO_URL)
			.then((client) => db = client.db('test'));
	});

	before(() => db.dropDatabase().then(() => {
		const collection = db.collection('sessions');
		return collection.insertMany(DATA.sessions);
	}));

	after(() => { db.close(); });

	it('should have sessions data saved', () => {
		const collection = db.collection('sessions');
		return collection.find().toArray()
			.then((docs) => assert.equal(docs.length, DATA.sessions.length));
	});

	it('should generate daily sessions', () => {
		const collection = db.collection('sessions');
		return aggregates.dailySessionsOfYesterday(collection, { year: 2019, month: 5, day: 2 })
			.then((docs) => {
				docs.forEach((doc) => {
					doc._id = `${ doc.userId }-${ doc.year }-${ doc.month }-${ doc.day }`;
				});

				assert.equal(docs.length, 2);
				assert.deepEqual(docs, [{
					_id: 'xPZXw9xqM3kKshsse-2019-5-2',
					time: 5814,
					sessions: 3,
					devices: [{
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
					}, {
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
					}],
					type: 'user_daily',
					_computedAt: docs[0]._computedAt,
					day: 2,
					month: 5,
					year: 2019,
					userId: 'xPZXw9xqM3kKshsse',
				}, {
					_id: 'xPZXw9xqM3kKshsse2-2019-5-1',
					time: 4167,
					sessions: 1,
					devices: [{
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
					}],
					type: 'user_daily',
					_computedAt: docs[1]._computedAt,
					day: 1,
					month: 5,
					year: 2019,
					userId: 'xPZXw9xqM3kKshsse2',
				}]);

				return collection.insertMany(docs);
			});
	});

	it('should have 2 unique users for month 5 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueUsersOfLastMonth(collection, { year: 2019, month: 5 })
			.then((docs) => {
				assert.equal(docs.length, 1);
				assert.deepEqual(docs, [{
					count: 2,
					sessions: 4,
					time: 9981,
				}]);
				// console.log(docs);
			});
	});

	it('should have 1 unique user for 1st of month 5 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueUsersOfYesterday(collection, { year: 2019, month: 5, day: 1 })
			.then((docs) => {
				assert.equal(docs.length, 1);
				assert.deepEqual(docs, [{
					count: 1,
					sessions: 1,
					time: 4167,
				}]);
				// console.log(docs);
			});
	});

	it('should have 1 unique user for 2nd of month 5 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueUsersOfYesterday(collection, { year: 2019, month: 5, day: 2 })
			.then((docs) => {
				assert.equal(docs.length, 1);
				assert.deepEqual(docs, [{
					count: 1,
					sessions: 3,
					time: 5814,
				}]);
				// console.log(docs);
			});
	});

	it('should have 2 unique devices for month 5 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueDevicesOfLastMonth(collection, { year: 2019, month: 5 })
			.then((docs) => {
				// console.log(JSON.stringify(docs, null, 2));
				assert.equal(docs.length, 2);
				assert.deepEqual(docs, [{
					count: 1,
					time: 286,
					type: 'browser',
					name: 'Firefox',
					version: '66.0.3',
				}, {
					count: 3,
					time: 9695,
					type: 'browser',
					name: 'Chrome',
					version: '73.0.3683',
				}]);
			});
	});

	it('should have 2 unique devices for 2nd of month 5 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueDevicesOfYesterday(collection, { year: 2019, month: 5, day: 2 })
			.then((docs) => {
				// console.log(JSON.stringify(docs, null, 2));
				assert.equal(docs.length, 2);
				assert.deepEqual(docs, [{
					count: 1,
					time: 286,
					type: 'browser',
					name: 'Firefox',
					version: '66.0.3',
				}, {
					count: 2,
					time: 5528,
					type: 'browser',
					name: 'Chrome',
					version: '73.0.3683',
				}]);
			});
	});

	it('should have 2 unique OS for month 5 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueOSOfLastMonth(collection, { year: 2019, month: 5 })
			.then((docs) => {
				// console.log(JSON.stringify(docs, null, 2));
				assert.equal(docs.length, 2);
				assert.deepEqual(docs, [{
					count: 1,
					time: 286,
					name: 'Linux',
					version: '12',
				}, {
					count: 3,
					time: 9695,
					name: 'Mac OS',
					version: '10.14.1',
				}]);
			});
	});

	it('should have 2 unique OS for 2nd of month 5 of 2019', () => {
		const collection = db.collection('sessions');
		return aggregates.getUniqueOSOfYesterday(collection, { year: 2019, month: 5, day: 2 })
			.then((docs) => {
				// console.log(JSON.stringify(docs, null, 2));
				assert.equal(docs.length, 2);
				assert.deepEqual(docs, [{
					count: 1,
					time: 286,
					name: 'Linux',
					version: '12',
				}, {
					count: 2,
					time: 5528,
					name: 'Mac OS',
					version: '10.14.1',
				}]);
			});
	});
});
