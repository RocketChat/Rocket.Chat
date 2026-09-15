import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const canAccessRoomAsyncMock = sinon.stub();
const userIdMock = sinon.stub();

const modelsMock = {
	Rooms: {
		findOneById: sinon.stub(),
	},
	Users: {
		findOneById: sinon.stub(),
	},
};

const { SearchResultValidationService } = p.noCallThru().load('../../../../../server/lib/search/service/SearchResultValidationService.ts', {
	'@rocket.chat/models': modelsMock,
	'@rocket.chat/tools': { isTruthy: (value: unknown) => Boolean(value) },
	'meteor/meteor': { Meteor: { userId: userIdMock } },
	'../../authorization': { canAccessRoomAsync: canAccessRoomAsyncMock },
	'../logger/logger': { SearchLogger: { debug: sinon.stub() } },
});

const messageInRoom1 = { _id: 'message1', rid: 'room1', u: { _id: 'author' } };

describe('SearchResultValidationService', () => {
	beforeEach(() => {
		canAccessRoomAsyncMock.reset();
		userIdMock.reset();
		modelsMock.Rooms.findOneById.reset();
		modelsMock.Users.findOneById.reset();

		modelsMock.Rooms.findOneById.resolves({ _id: 'room1', name: 'room1', t: 'p' });
		modelsMock.Users.findOneById.resolves({ _id: 'author', username: 'author' });
	});

	it('should not reuse the room access decision made for one user when another user searches the same room', async () => {
		canAccessRoomAsyncMock.callsFake(async (_room: unknown, user: { _id: string }) => user._id === 'member');
		const service = new SearchResultValidationService();

		userIdMock.returns('member');
		const memberResult = await service.validateSearchResult({ message: { docs: [messageInRoom1] } });

		userIdMock.returns('outsider');
		const outsiderResult = await service.validateSearchResult({ message: { docs: [messageInRoom1] } });

		expect(memberResult.message?.docs).to.have.lengthOf(1);
		expect(outsiderResult.message?.docs).to.have.lengthOf(0);
	});

	it('should decorate messages the user can access with the room and author details', async () => {
		canAccessRoomAsyncMock.resolves(true);
		userIdMock.returns('member');
		const service = new SearchResultValidationService();

		const { message } = await service.validateSearchResult({ message: { docs: [messageInRoom1] } });

		expect(message?.docs[0]).to.deep.include({
			_id: 'message1',
			user: 'author',
			username: 'author',
			r: { name: 'room1', t: 'p' },
			valid: true,
		});
	});

	it('should drop every message when the search result is validated without a logged in user', async () => {
		canAccessRoomAsyncMock.resolves(true);
		userIdMock.returns(null);
		const service = new SearchResultValidationService();

		const { message } = await service.validateSearchResult({ message: { docs: [messageInRoom1] } });

		expect(message?.docs).to.have.lengthOf(0);
		expect(canAccessRoomAsyncMock.called).to.be.false;
	});
});
