import { before, beforeEach, describe, it } from 'node:test';

import type { IRoomsModel, IUsersModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const insertUserDoc = sandbox.stub();
const createRoom = sandbox.stub();
const Users = { findOneById: sandbox.stub() };
const Rooms = { findOneByNameAndType: sandbox.stub() };

const { createNewUser } = p.noCallThru().load('./createNewUser.ts', {
	'meteor/accounts-base': { Accounts: { insertUserDoc } },
	'../rooms/createRoom': { createRoom },
});

const created = { _id: 'new-user-id', username: 'alice' };

describe('createNewUser (CAS)', () => {
	before(() => {
		registerModel('IUsersModel', Users as unknown as IUsersModel);
		registerModel('IRoomsModel', Rooms as unknown as IRoomsModel);
	});

	beforeEach(() => {
		sandbox.reset();
		insertUserDoc.resolves('new-user-id');
		Users.findOneById.resolves(created);
		Rooms.findOneByNameAndType.resolves(null);
	});

	it('should create an active user linked to the CAS username, with the email verified as the setting says', async () => {
		expect(
			await createNewUser('alice', {
				attributes: { email: 'alice@example.com', name: 'Alice Liddell', username: undefined, rooms: undefined },
				casVersion: 2,
				flagEmailAsVerified: false,
			}),
		).to.equal(created);

		expect(insertUserDoc.firstCall.args[1]).to.deep.equal({
			username: 'alice',
			name: 'Alice Liddell',
			active: true,
			globalRoles: ['user'],
			emails: [{ address: 'alice@example.com', verified: false }],
			services: {
				cas: {
					external_id: 'alice',
					version: 2,
					attrs: { email: 'alice@example.com', name: 'Alice Liddell', username: undefined, rooms: undefined },
				},
			},
		});
	});

	it('should take the username from the mapped attribute and keep the CAS username as the link', async () => {
		await createNewUser('alice.cas', { attributes: { username: 'alice' }, casVersion: 2, flagEmailAsVerified: true });

		expect(insertUserDoc.firstCall.args[1]).to.include({ username: 'alice' });
		expect(insertUserDoc.firstCall.args[1].services.cas.external_id).to.equal('alice.cas');
		expect(insertUserDoc.firstCall.args[1].emails).to.deep.equal([]);
	});

	it('should create the missing channels named in the rooms attribute with the new user', async () => {
		await createNewUser('alice', { attributes: { rooms: 'general,,support' }, casVersion: 2, flagEmailAsVerified: true });

		expect(createRoom.args).to.deep.equal([
			['c', 'general', created],
			['c', 'support', created],
		]);
	});

	it('should leave the channels of the rooms attribute that already exist untouched', async () => {
		Rooms.findOneByNameAndType.resolves({ _id: 'general-id', name: 'general' });

		await createNewUser('alice', { attributes: { rooms: 'general' }, casVersion: 2, flagEmailAsVerified: true });

		expect(createRoom.called).to.be.false;
	});
});
