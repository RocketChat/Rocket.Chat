import { before, beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const removeNotExpiredById = sinon.stub().resolves(null);
const findExistingCASUser = sinon.stub().resolves(null);
const settingsGet = sinon.stub().returns(true);
const updateUser = sinon.stub().resolves();
const createNewUser = sinon.stub().resolves({ _id: 'newUserId' });
const setRealName = sinon.stub().resolves();

const { loginHandlerCAS: handler } = proxyquire.noCallThru().load('./loginHandler', {
	'meteor/accounts-base': {
		Accounts: {
			LoginCancelledError: { numericError: 403 },
		},
	},
	'./createNewUser': { createNewUser },
	'./findExistingCASUser': { findExistingCASUser },
	'../users/setRealName': { setRealName },
	'../../settings': { settings: { get: settingsGet } },
});

describe('loginHandlerCAS', () => {
	before(() => {
		mockModel('CredentialTokens', { removeNotExpiredById });
		mockModel('Users', { updateOne: updateUser });
	});

	beforeEach(() => {
		removeNotExpiredById.reset();
		removeNotExpiredById.resolves(null);
		findExistingCASUser.reset();
		settingsGet.reset();
		settingsGet.returns(true);
		updateUser.resetHistory();
		createNewUser.resetHistory();
		setRealName.resetHistory();
	});

	it('should reject non-string credentialToken and never query the database (NoSQL injection prevention)', async () => {
		expect(await handler({ cas: { credentialToken: { $gt: '' } } })).to.be.undefined;
		expect(await handler({ cas: { credentialToken: { $ne: null } } })).to.be.undefined;
		expect(await handler({ cas: { credentialToken: 123 } })).to.be.undefined;
		expect(await handler({ cas: { credentialToken: ['a'] } })).to.be.undefined;
		expect(await handler({ cas: { credentialToken: null } })).to.be.undefined;

		expect(removeNotExpiredById.called).to.be.false;
	});

	it('should consume the credential token and reject when no matching login attempt is found', async () => {
		await expect(handler({ cas: { credentialToken: 'valid-token' } })).to.be.rejected;
		expect(removeNotExpiredById.calledOnceWith('valid-token')).to.be.true;
	});

	it('should return undefined when CAS is disabled', async () => {
		settingsGet.returns(false);

		expect(await handler({ cas: { credentialToken: 'valid-token' } })).to.be.undefined;
		expect(removeNotExpiredById.called).to.be.false;
	});

	describe('with a validated ticket', () => {
		const settingValues = new Map<string, unknown>();

		beforeEach(() => {
			removeNotExpiredById.resolves({
				userInfo: { username: 'alice', attributes: { mail: ['alice@example.com'], displayName: ['Alice Liddell'] } },
			});
			settingValues.clear();
			settingValues.set('CAS_enabled', true);
			settingValues.set('CAS_version', '2.0');
			settingValues.set('CAS_Sync_User_Data_FieldMap', '{"email": "%mail%", "name": "%displayName%"}');
			settingValues.set('CAS_Sync_User_Data_Enabled', false);
			settingValues.set('Accounts_Verify_Email_For_External_Accounts', true);
			settingValues.set('CAS_Creation_User_Enabled', false);
			settingsGet.callsFake((key: string) => settingValues.get(key));
		});

		it('should log in the account already linked to the CAS user', async () => {
			findExistingCASUser.resolves({ _id: 'aliceId' });

			expect(await handler({ cas: { credentialToken: 'valid-token' } })).to.deep.equal({ userId: 'aliceId' });
			expect(findExistingCASUser.calledOnceWith('alice')).to.be.true;
			expect(createNewUser.called).to.be.false;
			expect(updateUser.called).to.be.false;
		});

		it('should refresh the name and email of the linked account from the mapped CAS attributes when sync is on', async () => {
			settingValues.set('CAS_Sync_User_Data_Enabled', true);
			settingValues.set('Accounts_Verify_Email_For_External_Accounts', false);
			findExistingCASUser.resolves({ _id: 'aliceId' });

			await handler({ cas: { credentialToken: 'valid-token' } });

			expect(setRealName.calledOnceWith('aliceId', 'Alice Liddell')).to.be.true;
			expect(updateUser.firstCall.args).to.deep.equal([
				{ _id: 'aliceId' },
				{ $set: { emails: [{ address: 'alice@example.com', verified: false }] } },
			]);
		});

		it('should refuse an unknown CAS user while user creation is off', async () => {
			await expect(handler({ cas: { credentialToken: 'valid-token' } })).to.be.rejectedWith('no matching user account found');
			expect(createNewUser.called).to.be.false;
		});

		it('should create an unknown CAS user with the mapped attributes while user creation is on', async () => {
			settingValues.set('CAS_Creation_User_Enabled', true);

			expect(await handler({ cas: { credentialToken: 'valid-token' } })).to.deep.equal({ userId: 'newUserId' });
			expect(createNewUser.firstCall.args).to.deep.equal([
				'alice',
				{
					attributes: { email: 'alice@example.com', name: 'Alice Liddell', username: undefined, rooms: undefined },
					casVersion: 2,
					flagEmailAsVerified: true,
				},
			]);
		});

		it('should ignore CAS attributes from a CAS 1.0 server', async () => {
			settingValues.set('CAS_version', '1.0');
			settingValues.set('CAS_Creation_User_Enabled', true);

			await handler({ cas: { credentialToken: 'valid-token' } });

			expect(createNewUser.firstCall.args[1].attributes).to.deep.equal({
				email: undefined,
				name: undefined,
				username: undefined,
				rooms: undefined,
			});
		});
	});
});
