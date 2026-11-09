import { before, beforeEach, describe, it } from 'node:test';

import type { IUsersModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const settingValues = new Map<string, unknown>();
const Users = { findOne: sandbox.stub(), setCasExternalIdByUsername: sandbox.stub() };

const { findExistingCASUser } = p.noCallThru().load('./findExistingCASUser.ts', {
	'../../settings': { settings: { get: (key: string) => settingValues.get(key) } },
});

const localAlice = { _id: 'local-alice', username: 'alice' };

describe('findExistingCASUser', () => {
	before(() => {
		registerModel('IUsersModel', Users as unknown as IUsersModel);
	});

	beforeEach(() => {
		sandbox.reset();
		settingValues.clear();
		Users.findOne.resolves(null);
		Users.setCasExternalIdByUsername.resolves(localAlice);
	});

	it('should return the account already linked to the CAS username', async () => {
		const casAlice = { _id: 'cas-alice' };
		Users.findOne.resolves(casAlice);

		expect(await findExistingCASUser('alice')).to.equal(casAlice);
		expect(Users.findOne.calledOnceWith({ 'services.cas.external_id': 'alice' })).to.be.true;
		expect(Users.setCasExternalIdByUsername.called).to.be.false;
	});

	it('should not hand a local account to a CAS user of the same username unless usernames are trusted', async () => {
		expect(await findExistingCASUser('alice')).to.be.undefined;
		expect(Users.setCasExternalIdByUsername.called).to.be.false;
	});

	it('should link the local account of the same username to CAS when usernames are trusted', async () => {
		settingValues.set('CAS_trust_username', true);

		expect(await findExistingCASUser('alice')).to.equal(localAlice);
		expect(Users.setCasExternalIdByUsername.calledOnceWith('alice')).to.be.true;
	});
});
