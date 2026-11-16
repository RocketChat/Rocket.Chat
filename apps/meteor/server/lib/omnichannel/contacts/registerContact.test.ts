import { before, beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Users: {
		findOneAgentById: sinon.stub(),
		findOneByUsername: sinon.stub(),
	},
	LivechatRooms: {
		findNewestByVisitorIdOrToken: sinon.stub(),
		setContactIdByVisitorIdOrToken: sinon.stub(),
		findByVisitorId: sinon.stub(),
	},
	LivechatVisitors: {
		findOneById: sinon.stub(),
		updateById: sinon.stub(),
		updateOne: sinon.stub(),
		getVisitorByToken: sinon.stub(),
		findOneGuestByEmailAddress: sinon.stub(),
	},
	LivechatCustomField: {
		findByScope: sinon.stub(),
	},
};

const { registerContact } = proxyquire.noCallThru().load('./registerContact', {
	'meteor/meteor': sinon.stub(),
	'@rocket.chat/tools': { wrapExceptions: sinon.stub() },
});

describe('registerContact', () => {
	before(() => {
		mockModel('Users', modelsMock.Users);
		mockModel('LivechatRooms', modelsMock.LivechatRooms);
		mockModel('LivechatVisitors', modelsMock.LivechatVisitors);
		mockModel('LivechatCustomField', modelsMock.LivechatCustomField);
	});

	beforeEach(() => {
		modelsMock.Users.findOneByUsername.reset();
		modelsMock.LivechatVisitors.getVisitorByToken.reset();
		modelsMock.LivechatVisitors.updateOne.reset();
		modelsMock.LivechatVisitors.findOneGuestByEmailAddress.reset();
		modelsMock.LivechatCustomField.findByScope.reset();
		modelsMock.LivechatRooms.findByVisitorId.reset();
	});

	it(`should throw an error if there's no token`, async () => {
		modelsMock.Users.findOneByUsername.returns(undefined);

		await expect(
			registerContact({
				email: 'test@test.com',
				username: 'username',
				name: 'Name',
				contactManager: {
					username: 'unknown',
				},
			}),
		).to.eventually.be.rejectedWith('error-invalid-contact-data');
	});

	it(`should throw an error if the token is not a string`, async () => {
		modelsMock.Users.findOneByUsername.returns(undefined);

		await expect(
			registerContact({
				token: 15,
				email: 'test@test.com',
				username: 'username',
				name: 'Name',
				contactManager: {
					username: 'unknown',
				},
			}),
		).to.eventually.be.rejectedWith('error-invalid-contact-data');
	});

	it(`should throw an error if there's an invalid manager username`, async () => {
		modelsMock.Users.findOneByUsername.returns(undefined);

		await expect(
			registerContact({
				token: 'token',
				email: 'test@test.com',
				username: 'username',
				name: 'Name',
				contactManager: {
					username: 'unknown',
				},
			}),
		).to.eventually.be.rejectedWith('error-contact-manager-not-found');
	});

	it(`should throw an error if the manager username does not belong to a livechat agent`, async () => {
		modelsMock.Users.findOneByUsername.returns({ roles: ['user'] });

		await expect(
			registerContact({
				token: 'token',
				email: 'test@test.com',
				username: 'username',
				name: 'Name',
				contactManager: {
					username: 'username',
				},
			}),
		).to.eventually.be.rejectedWith('error-invalid-contact-manager');
	});

	it('should register a contact when passing valid data', async () => {
		modelsMock.LivechatVisitors.getVisitorByToken.returns({ _id: 'visitor1' });
		modelsMock.LivechatCustomField.findByScope.returns({ toArray: () => [] });
		modelsMock.LivechatRooms.findByVisitorId.returns({ toArray: () => [] });
		modelsMock.LivechatVisitors.updateOne.returns(undefined);

		await expect(
			registerContact({
				token: 'token',
				email: 'test@test.com',
				username: 'username',
				name: 'Name',
			}),
		).to.eventually.be.equal('visitor1');
	});
});
