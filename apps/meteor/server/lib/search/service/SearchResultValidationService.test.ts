import { before, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const { SearchResultValidationService } = proxyquire.noCallThru().load('./SearchResultValidationService', {
	'meteor/meteor': { Meteor: { userId: () => 'viewer' } },
	'../../authorization': { canAccessRoomAsync: sinon.stub().resolves(true) },
	'../logger/logger': { SearchLogger: { debug: sinon.stub() } },
});

describe('SearchResultValidationService', () => {
	before(() => {
		mockModel('Users', { findOneById: sinon.stub().resolves({ _id: 'author', username: 'alice' }) });
		mockModel('Rooms', { findOneById: sinon.stub().resolves({ _id: 'room1', name: 'general', t: 'c' }) });
	});

	it('should return only the public identity of message authors', async () => {
		const result = await new SearchResultValidationService().validateSearchResult({
			message: {
				docs: [
					{
						_id: 'msg1',
						rid: 'room1',
						msg: 'hello',
						u: { _id: 'author', username: 'alice', name: 'Alice', emails: [{ address: 'alice@example.com', verified: true }] },
					},
				],
			},
		});

		expect(result.message.docs[0].u).to.deep.equal({ _id: 'author', username: 'alice', name: 'Alice' });
	});
});
