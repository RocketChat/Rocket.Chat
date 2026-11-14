import { before, beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

import type { ILoginAttempt } from './ILoginAttempt';

const sandbox = sinon.createSandbox();

const settingValues = new Map<string, unknown>();
const sendMessage = sandbox.stub();

const ServerEvents = {
	findLastFailedAttemptByIp: sandbox.stub(),
	findLastSuccessfulAttemptByIp: sandbox.stub(),
	countFailedAttemptsByIpSince: sandbox.stub(),
	findLastFailedAttemptByUsername: sandbox.stub(),
	findLastSuccessfulAttemptByUsername: sandbox.stub(),
	countFailedAttemptsByUsernameSince: sandbox.stub(),
};
const Rooms = { findOneByNameOrFname: sandbox.stub() };
const Users = { findOneById: sandbox.stub() };

const { isValidLoginAttemptByIp, isValidAttemptByUser } = p.noCallThru().load('./restrictLoginAttempts.ts', {
	'../../settings': { settings: { get: (key: string) => settingValues.get(key) } },
	'../messages/sendMessage': { sendMessage },
});

const lastFailedAt = new Date('2026-11-04T10:00:00.000Z');
const rocketCat = { _id: 'rocket.cat', username: 'rocket.cat' };
const alertRoom = { _id: 'security-room', name: 'security' };

const loginAs = (username?: string) => ({ methodArguments: [{ user: username ? { username } : undefined }] }) as ILoginAttempt;

describe('restrictLoginAttempts', () => {
	before(() => {
		mockModel('ServerEvents', ServerEvents);
		mockModel('Rooms', Rooms);
		mockModel('Users', Users);
	});

	beforeEach(() => {
		sandbox.resetHistory();
		settingValues.clear();
		settingValues.set('Block_Multiple_Failed_Logins_Enabled', true);
		settingValues.set('Block_Multiple_Failed_Logins_By_Ip', true);
		settingValues.set('Block_Multiple_Failed_Logins_By_User', true);
		settingValues.set('Block_Multiple_Failed_Logins_Ip_Whitelist', '10.0.0.1,10.0.0.2');
		settingValues.set('Block_Multiple_Failed_Logins_Attempts_Until_Block_By_Ip', 5);
		settingValues.set('Block_Multiple_Failed_Logins_Time_To_Unblock_By_Ip_In_Minutes', 10);
		settingValues.set('Block_Multiple_Failed_Logins_Attempts_Until_Block_by_User', 5);
		settingValues.set('Block_Multiple_Failed_Logins_Time_To_Unblock_By_User_In_Minutes', 10);

		ServerEvents.findLastFailedAttemptByIp.resolves({ ts: lastFailedAt });
		ServerEvents.findLastSuccessfulAttemptByIp.resolves(null);
		ServerEvents.countFailedAttemptsByIpSince.resolves(5);
		ServerEvents.findLastFailedAttemptByUsername.resolves({ ts: lastFailedAt });
		ServerEvents.findLastSuccessfulAttemptByUsername.resolves(null);
		ServerEvents.countFailedAttemptsByUsernameSince.resolves(5);
		Rooms.findOneByNameOrFname.resolves(alertRoom);
		Users.findOneById.resolves(rocketCat);
	});

	describe('by IP', () => {
		it('should block an address that reached the failed attempt limit', async () => {
			expect(await isValidLoginAttemptByIp('203.0.113.7')).to.be.false;
		});

		it('should never block a whitelisted address, whatever its failed attempts', async () => {
			expect(await isValidLoginAttemptByIp('10.0.0.2')).to.be.true;
		});

		it('should not block anyone while the attempt limit is unset', async () => {
			settingValues.set('Block_Multiple_Failed_Logins_Attempts_Until_Block_By_Ip', 0);

			expect(await isValidLoginAttemptByIp('203.0.113.7')).to.be.true;
		});

		it('should alert the configured channel as rocket.cat when it blocks an address', async () => {
			settingValues.set('Block_Multiple_Failed_Logins_Notify_Failed', true);
			settingValues.set('Block_Multiple_Failed_Logins_Notify_Failed_Channel', 'security');

			await isValidLoginAttemptByIp('203.0.113.7');

			expect(Rooms.findOneByNameOrFname.calledOnceWith('security')).to.be.true;
			expect(sendMessage.calledOnce).to.be.true;
			const [sender, message, room] = sendMessage.firstCall.args;
			expect(sender).to.equal(rocketCat);
			expect(room).to.equal(alertRoom);
			expect(message.attachments[0].fields[0].value).to.equal(
				`User or IP: 203.0.113.7\nBlocked until: ${new Date('2026-11-04T10:10:00.000Z')}\nFailed Attempts: 5`,
			);
		});

		it('should still block the address when the alert channel does not exist', async () => {
			settingValues.set('Block_Multiple_Failed_Logins_Notify_Failed', true);
			settingValues.set('Block_Multiple_Failed_Logins_Notify_Failed_Channel', 'missing');
			Rooms.findOneByNameOrFname.resolves(null);

			expect(await isValidLoginAttemptByIp('203.0.113.7')).to.be.false;
			expect(sendMessage.called).to.be.false;
		});

		it('should not alert anyone while the address is under the limit', async () => {
			settingValues.set('Block_Multiple_Failed_Logins_Notify_Failed', true);
			settingValues.set('Block_Multiple_Failed_Logins_Notify_Failed_Channel', 'security');
			ServerEvents.countFailedAttemptsByIpSince.resolves(4);

			expect(await isValidLoginAttemptByIp('203.0.113.7')).to.be.true;
			expect(sendMessage.called).to.be.false;
		});
	});

	describe('by user', () => {
		it('should block a username that reached the failed attempt limit', async () => {
			expect(await isValidAttemptByUser(loginAs('alice'))).to.be.false;
		});

		it('should not block anyone while the attempt limit is unset', async () => {
			settingValues.set('Block_Multiple_Failed_Logins_Attempts_Until_Block_by_User', 0);

			expect(await isValidAttemptByUser(loginAs('alice'))).to.be.true;
		});

		it('should alert the configured channel with the blocked username', async () => {
			settingValues.set('Block_Multiple_Failed_Logins_Notify_Failed', true);
			settingValues.set('Block_Multiple_Failed_Logins_Notify_Failed_Channel', 'security');

			await isValidAttemptByUser(loginAs('alice'));

			expect(sendMessage.firstCall.args[1].attachments[0].fields[0].value).to.match(/^User or IP: alice\n/);
		});
	});
});
