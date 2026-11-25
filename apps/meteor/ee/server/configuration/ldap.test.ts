import { before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const workspaceSettings = new Map<string, unknown>();
const watchers = new Map<string, () => Promise<void>>();
const scheduledJobs = new Map<string, { schedule: string; run: () => void }>();
const LDAPEnterprise = {
	sync: sinon.stub(),
	syncAvatars: sinon.stub(),
	syncLogout: sinon.stub(),
	syncAbacAttributes: sinon.stub(),
};
const findSetting = sinon.stub();

const jobs = [
	{ name: 'LDAP_Sync', enable: 'LDAP_Background_Sync', interval: 'LDAP_Background_Sync_Interval', sync: LDAPEnterprise.sync },
	{
		name: 'LDAP_AvatarSync',
		enable: 'LDAP_Background_Sync_Avatars',
		interval: 'LDAP_Background_Sync_Avatars_Interval',
		sync: LDAPEnterprise.syncAvatars,
	},
	{
		name: 'LDAP_AutoLogout',
		enable: 'LDAP_Sync_AutoLogout_Enabled',
		interval: 'LDAP_Sync_AutoLogout_Interval',
		sync: LDAPEnterprise.syncLogout,
	},
	{
		name: 'LDAP_AbacSync',
		enable: 'LDAP_Background_Sync_ABAC_Attributes',
		interval: 'LDAP_Background_Sync_ABAC_Attributes_Interval',
		sync: LDAPEnterprise.syncAbacAttributes,
	},
];

const changeSettings = async (values: Record<string, unknown>, watched: string) => {
	Object.entries(values).forEach(([key, value]) => workspaceSettings.set(key, value));
	await watchers.get(watched)?.();
};

before(async () => {
	const settings = {
		get: (key: string) => workspaceSettings.get(key),
		watch: (key: string, cb: () => Promise<void>) => watchers.set(key, cb),
		watchMultiple: (keys: string[], cb: () => Promise<void>) => keys.forEach((key) => watchers.set(key, cb)),
	};
	mock.module('../../../server/settings', { exports: { settings, settingsRegistry: {} } });
	const ldapSettings = await import('../settings/ldap');
	mock.module('../settings/ldap', { exports: { ...ldapSettings, addSettings: sinon.stub().resolves() } });
	mock.module('@rocket.chat/core-services', { exports: { LDAPEnterprise } });
	mock.module('@rocket.chat/license', { exports: { License: { onLicense: (_: string, cb: () => Promise<void>) => cb() } } });
	mock.module('@rocket.chat/cron', {
		exports: {
			cronJobs: {
				has: async (name: string) => scheduledJobs.has(name),
				add: async (name: string, schedule: string, run: () => void) => scheduledJobs.set(name, { schedule, run }),
				remove: async (name: string) => scheduledJobs.delete(name),
			},
		},
	});
	mock.module('../../../server/lib/callbacks', { exports: { callbacks: { add: sinon.stub(), priority: { MEDIUM: 0 } } } });
	mock.module('../lib/ldap/EEManager', { exports: { LDAPEEManager: {} } });
	mock.module('../lib/ldap/Logger', { exports: { logger: { info: sinon.stub(), error: sinon.stub() } } });

	const { configureLdapEnterprise } = await import('./ldap');
	await configureLdapEnterprise();
});

describe('LDAP background jobs', () => {
	beforeEach(() => {
		scheduledJobs.clear();
		Object.values(LDAPEnterprise).forEach((stub) => stub.reset());
		mockModel('Settings', { findOneById: findSetting });
	});

	for (const job of jobs) {
		describe(job.name, () => {
			it('should run the job on the schedule of the chosen interval when it is turned on', async () => {
				await changeSettings({ LDAP_Enable: true, [job.enable]: true, [job.interval]: 'every_6_hours' }, job.enable);

				expect(scheduledJobs.get(job.name)?.schedule).to.equal('0 */6 * * *');
				scheduledJobs.get(job.name)?.run();
				expect(job.sync.calledOnce).to.be.true;
			});

			it('should move the job to the new schedule when the interval changes', async () => {
				await changeSettings({ LDAP_Enable: true, [job.enable]: true, [job.interval]: 'every_6_hours' }, job.enable);
				await changeSettings({ [job.interval]: 'every_24_hours' }, job.interval);

				expect(scheduledJobs.get(job.name)?.schedule).to.equal('0 0 * * *');
			});

			it('should stop the job when it is turned off', async () => {
				await changeSettings({ LDAP_Enable: true, [job.enable]: true, [job.interval]: 'every_6_hours' }, job.enable);
				await changeSettings({ [job.enable]: false }, job.enable);

				expect(scheduledJobs.has(job.name)).to.be.false;
			});
		});
	}

	it('should stop every job when LDAP is turned off', async () => {
		await changeSettings(
			Object.fromEntries(
				jobs.flatMap((job) => [
					[job.enable, true],
					[job.interval, 'every_1_hour'],
				]),
			),
			'LDAP_Enable',
		);
		await changeSettings({ LDAP_Enable: true }, 'LDAP_Enable');
		expect([...scheduledJobs.keys()]).to.have.members(jobs.map((job) => job.name));

		await changeSettings({ LDAP_Enable: false }, 'LDAP_Enable');

		expect(scheduledJobs.size).to.equal(0);
	});

	it('should use a custom cron expression as the schedule', async () => {
		await changeSettings(
			{ LDAP_Enable: true, LDAP_Background_Sync: true, LDAP_Background_Sync_Interval: '*/15 * * * *' },
			'LDAP_Background_Sync',
		);

		expect(scheduledJobs.get('LDAP_Sync')?.schedule).to.equal('*/15 * * * *');
	});

	it('should schedule the raw default interval name when the interval is not a valid cron expression', async () => {
		findSetting.withArgs('LDAP_Background_Sync_Interval').resolves({ packageValue: 'every_24_hours' });

		await changeSettings(
			{ LDAP_Enable: true, LDAP_Background_Sync: true, LDAP_Background_Sync_Interval: 'not a cron' },
			'LDAP_Background_Sync',
		);

		expect(scheduledJobs.get('LDAP_Sync')?.schedule).to.equal('every_24_hours');
	});
});
