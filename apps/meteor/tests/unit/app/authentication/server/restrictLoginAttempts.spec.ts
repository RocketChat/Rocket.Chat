import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('restrictLoginAttempts', () => {
	const settingsGet = sinon.stub();
	const findLastFailedAttemptByIp = sinon.stub();
	const findLastSuccessfulAttemptByIp = sinon.stub();
	const countFailedAttemptsByIpSince = sinon.stub();
	const findLastFailedAttemptByUsername = sinon.stub();
	const findLastSuccessfulAttemptByUsername = sinon.stub();
	const countFailedAttemptsByUsernameSince = sinon.stub();
	const findOneByNameOrFname = sinon.stub();
	const findOneById = sinon.stub();
	const sendMessage = sinon.stub();

	const loadModule = () =>
		proxyquire.noCallThru().load('../../../../../app/authentication/server/lib/restrictLoginAttempts', {
			'@rocket.chat/models': {
				Rooms: {
					findOneByNameOrFname,
				},
				ServerEvents: {
					findLastFailedAttemptByIp,
					findLastSuccessfulAttemptByIp,
					countFailedAttemptsByIpSince,
					findLastFailedAttemptByUsername,
					findLastSuccessfulAttemptByUsername,
					countFailedAttemptsByUsernameSince,
				},
				Users: {
					findOneById,
				},
			},
			'../../../settings/server': {
				settings: {
					get: settingsGet,
				},
			},
			'../../../lib/server/functions/sendMessage': {
				sendMessage,
			},
		});

	beforeEach(() => {
		settingsGet.reset();
		findLastFailedAttemptByIp.reset();
		findLastSuccessfulAttemptByIp.reset();
		countFailedAttemptsByIpSince.reset();
		findLastFailedAttemptByUsername.reset();
		findLastSuccessfulAttemptByUsername.reset();
		countFailedAttemptsByUsernameSince.reset();
		findOneByNameOrFname.reset();
		findOneById.reset();
		sendMessage.reset();

		settingsGet.callsFake((key: string) => {
			const values = {
				Block_Multiple_Failed_Logins_Enabled: true,
				Block_Multiple_Failed_Logins_By_Ip: true,
				Block_Multiple_Failed_Logins_Ip_Whitelist: '',
				Block_Multiple_Failed_Logins_Attempts_Until_Block_By_Ip: 3,
				Block_Multiple_Failed_Logins_Time_To_Unblock_By_Ip_In_Minutes: 5,
				Block_Multiple_Failed_Logins_By_User: true,
				Block_Multiple_Failed_Logins_Attempts_Until_Block_by_User: 3,
				Block_Multiple_Failed_Logins_Time_To_Unblock_By_User_In_Minutes: 5,
				Block_Multiple_Failed_Logins_Notify_Failed: true,
				Block_Multiple_Failed_Logins_Notify_Failed_Channel: 'security-alerts',
			} as Record<string, unknown>;

			return values[key];
		});

		findLastSuccessfulAttemptByIp.resolves(null);
		countFailedAttemptsByIpSince.resolves(3);
		findLastSuccessfulAttemptByUsername.resolves(null);
		countFailedAttemptsByUsernameSince.resolves(3);
		findOneByNameOrFname.resolves({ _id: 'room-id' });
		findOneById.resolves({ _id: 'rocket.cat' });
		sendMessage.resolves(undefined);
	});

	it('should notify only once for the same IP block window', async () => {
		const lastFailedAt = new Date('2026-02-25T10:00:00.000Z');
		findLastFailedAttemptByIp.resolves({ ts: lastFailedAt });

		const { isValidLoginAttemptByIp } = loadModule();

		const firstAttemptValid = await isValidLoginAttemptByIp('10.0.0.1');
		const secondAttemptValid = await isValidLoginAttemptByIp('10.0.0.1');

		expect(firstAttemptValid).to.be.false;
		expect(secondAttemptValid).to.be.false;
		expect(sendMessage.calledOnce).to.be.true;
	});

	it('should notify again when a new IP block window starts', async () => {
		findLastFailedAttemptByIp.onFirstCall().resolves({ ts: new Date('2026-02-25T10:00:00.000Z') });
		findLastFailedAttemptByIp.onSecondCall().resolves({ ts: new Date('2026-02-25T10:10:00.000Z') });

		const { isValidLoginAttemptByIp } = loadModule();

		await isValidLoginAttemptByIp('10.0.0.1');
		await isValidLoginAttemptByIp('10.0.0.1');

		expect(sendMessage.calledTwice).to.be.true;
	});

	it('should notify only once for the same user block window', async () => {
		const lastFailedAt = new Date('2026-02-25T10:00:00.000Z');
		findLastFailedAttemptByUsername.resolves({ ts: lastFailedAt });

		const { isValidAttemptByUser } = loadModule();
		const login = { methodArguments: [{ user: { username: 'alice' } }] };

		const firstAttemptValid = await isValidAttemptByUser(login);
		const secondAttemptValid = await isValidAttemptByUser(login);

		expect(firstAttemptValid).to.be.false;
		expect(secondAttemptValid).to.be.false;
		expect(sendMessage.calledOnce).to.be.true;
	});
});
