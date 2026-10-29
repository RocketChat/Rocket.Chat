import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const subscriptionsMock = {
	findByUserId: sinon.stub(),
	trashFindDeletedAfter: sinon.stub(),
};

const { getSubscriptions } = proxyquire.noCallThru().load('./index', {
	'meteor/meteor': {
		'Meteor': {
			methods: sinon.stub(),
		},
		'@global': true,
	},
	'@rocket.chat/models': {
		Subscriptions: subscriptionsMock,
	},
	'../../../lib/publishFields': {
		subscriptionFields: {},
	},
});

describe('getSubscriptions', () => {
	beforeEach(() => {
		subscriptionsMock.findByUserId.reset();
		subscriptionsMock.trashFindDeletedAfter.reset();
		subscriptionsMock.findByUserId.returns({ toArray: sinon.stub().resolves([]) });
		subscriptionsMock.trashFindDeletedAfter.returns({ toArray: sinon.stub().resolves([]) });
	});

	it('should return the room id of each removed subscription, so the client can remove the local data of that room', async () => {
		const updatedAt = new Date('2024-01-01T00:00:00.000Z');
		const removed = { _id: 'sid', rid: 'rid', _deletedAt: new Date('2024-01-02T00:00:00.000Z') };
		subscriptionsMock.trashFindDeletedAfter.returns({ toArray: sinon.stub().resolves([removed]) });

		const result = await getSubscriptions('uid', updatedAt);

		expect(result).to.deep.equal({ update: [], remove: [removed] });
		sinon.assert.calledOnceWithExactly(
			subscriptionsMock.trashFindDeletedAfter,
			updatedAt,
			{ 'u._id': 'uid' },
			{ projection: { _id: 1, rid: 1, _deletedAt: 1 } },
		);
	});

	it('should not read removed subscriptions without an updatedAt', async () => {
		const result = await getSubscriptions('uid');

		expect(result).to.deep.equal([]);
		sinon.assert.notCalled(subscriptionsMock.trashFindDeletedAfter);
	});
});
