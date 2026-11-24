import { before, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

let SearchResultValidationService: any;

before(async () => {
	const moduleMocks = [
		mock.module(require.resolve('meteor/meteor'), { exports: { Meteor: { userId: () => 'viewer' } } }),
		mock.module('../../authorization', { exports: { canAccessRoomAsync: sinon.stub().resolves(true) } }),
		mock.module('../logger/logger', { exports: { SearchLogger: { debug: sinon.stub() } } }),
	];
	({ SearchResultValidationService } = await import('./SearchResultValidationService'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
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
