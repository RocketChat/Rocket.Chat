import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { permissions } from '../../../../../server/lib/authorization/constant/permissions';

type Migration = { version: number; up: () => Promise<void> };

describe('Invite upgrade migrations', () => {
	let permissionMigration: Migration;
	let tokenMigration: Migration;
	let deadline: Date | undefined;
	let pending: Map<string, { expires?: Date }>;
	let migrated: Map<string, Date>;
	let permissionRoles: Map<string, string[]>;
	const migrateLegacyInvite = sinon.stub();
	const createIndex = sinon.stub();

	beforeEach(() => {
		deadline = undefined;
		pending = new Map([['old-id', {}]]);
		migrated = new Map();
		permissionRoles = new Map([['create-invite-links', ['admin', 'owner', 'moderator', 'custom-creator']]]);
		migrateLegacyInvite.reset();
		createIndex.reset();
		migrateLegacyInvite.callsFake(async (_id: string, expiresAt: Date) => {
			migrated.set(_id, pending.get(_id)?.expires || expiresAt);
			pending.delete(_id);
		});
		const dependencies = {
			'@rocket.chat/models': {
				Permissions: {
					create: async (id: string, roles: string[]) => {
						if (!permissionRoles.has(id)) {
							permissionRoles.set(id, roles);
						}
					},
				},
				Migrations: {
					findOneAndUpdate: async (_query: unknown, update: { $setOnInsert: { expiresAt: Date } }) => {
						deadline ||= update.$setOnInsert.expiresAt;
						return { expiresAt: deadline };
					},
				},
				Invites: {
					find: (_query: unknown, options: { limit: number }) => ({
						map: (map: (invite: { _id: string }) => string) => ({
							toArray: async () => [...pending.keys()].slice(0, options.limit).map((_id) => map({ _id })),
						}),
					}),
					migrateLegacyInvite,
					col: { createIndex },
				},
			},
			'../../database/utils': {
				client: {
					withSession: async (callback: (session: unknown) => Promise<void>) =>
						callback({
							withTransaction: async (transaction: () => Promise<void>) => transaction(),
						}),
				},
			},
			'../../lib/migrations': {
				addMigration: (migration: Migration) => {
					if (migration.version === 351) {
						permissionMigration = migration;
					} else {
						tokenMigration = migration;
					}
				},
			},
		};
		const loader = proxyquire.noCallThru();
		loader.load('../../../../../server/startup/migrations/v351', dependencies);
		loader.load('../../../../../server/startup/migrations/v352', dependencies);
	});

	it('grants management to admins without copying custom creator roles', async () => {
		await permissionMigration.up();
		expect(permissionRoles.get('manage-invite-links')).to.deep.equal(['admin']);
		expect(permissionRoles.get('create-invite-links')).to.deep.equal(['admin', 'owner', 'moderator', 'custom-creator']);
		expect(permissions.find(({ _id }) => _id === 'manage-invite-links')?.roles).to.deep.equal(['admin']);
	});

	it('preserves an existing management permission configuration on rerun', async () => {
		permissionRoles.set('manage-invite-links', ['custom-manager']);
		await permissionMigration.up();
		await permissionMigration.up();
		expect(permissionRoles.get('manage-invite-links')).to.deep.equal(['custom-manager']);
	});

	it('sets a 90-day cutoff and preserves it if the migration is rerun', async () => {
		const clock = sinon.useFakeTimers(new Date('2026-10-09T00:00:00Z'));
		try {
			await tokenMigration.up();
			expect(deadline).to.deep.equal(new Date('2027-01-07T00:00:00Z'));
			clock.tick(24 * 60 * 60 * 1000);
			await tokenMigration.up();
			expect(deadline).to.deep.equal(new Date('2027-01-07T00:00:00Z'));
			expect(migrateLegacyInvite.callCount).to.equal(1);
		} finally {
			clock.restore();
		}
	});

	it('processes workspaces with more than one batch of legacy invites', async () => {
		pending = new Map(Array.from({ length: 1001 }, (_, index) => [`old-${index}`, {}]));
		await tokenMigration.up();
		expect(pending.size).to.equal(0);
		expect(migrated.size).to.equal(1001);
		expect(createIndex.calledOnce).to.equal(true);
	});

	it('resumes after interruption without extending the cutoff for remaining invites', async () => {
		pending.set('second-id', {});
		migrateLegacyInvite.onSecondCall().rejects(new Error('interrupted'));
		await expect(tokenMigration.up()).to.be.rejectedWith('interrupted');
		const originalDeadline = deadline;
		expect(pending.size).to.equal(1);
		expect(createIndex.called).to.equal(false);
		await tokenMigration.up();
		expect(migrated.get('second-id')).to.equal(originalDeadline);
		expect(pending.size).to.equal(0);
	});
});
