import { expect } from 'chai';
import { beforeEach, describe, it, vi } from 'vitest';

const { modelsMock, meteorMock, wrapExceptions, validateEmail, sandbox } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	const sandbox = sinon.createSandbox();
	return {
		sandbox,
		meteorMock: sandbox.stub(),
		wrapExceptions: sandbox.stub(),
		validateEmail: sandbox.stub(),
		modelsMock: {
			Users: {
				findOneAgentById: sandbox.stub(),
				findOneByUsername: sandbox.stub(),
			},
			LivechatContacts: {
				findOneById: sandbox.stub(),
				insertOne: sandbox.stub(),
				upsertContact: sandbox.stub(),
				updateContact: sandbox.stub(),
				findContactMatchingVisitor: sandbox.stub(),
			},
			LivechatRooms: {
				findNewestByVisitorIdOrToken: sandbox.stub(),
				setContactIdByVisitorIdOrToken: sandbox.stub(),
				findByVisitorId: sandbox.stub(),
			},
			LivechatVisitors: {
				findOneById: sandbox.stub(),
				updateById: sandbox.stub(),
				updateOne: sandbox.stub(),
				getVisitorByToken: sandbox.stub(),
				findOneGuestByEmailAddress: sandbox.stub(),
			},
			LivechatCustomField: {
				findByScope: sandbox.stub(),
			},
		},
	};
});

vi.mock('meteor/meteor', () => ({ default: meteorMock, ...meteorMock }));
vi.mock('@rocket.chat/models', () => modelsMock);
vi.mock('@rocket.chat/tools', () => ({ wrapExceptions }));
vi.mock('./Helper', () => ({ validateEmail }));

const { registerContact } = await import('./registerContact');

describe('registerContact', () => {
	beforeEach(() => {
		sandbox.reset();
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
