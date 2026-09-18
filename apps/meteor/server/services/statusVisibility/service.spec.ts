import { StatusVisibilityService } from './service';
import { hiddenIds } from '../../lib/statusVisibility/presenceScope';

const settingValues: Record<string, unknown> = {};
const broadcast = jest.fn();
const findPresenceUsersByIds = jest.fn();
const findWithStatusVisibilityConfig = jest.fn();
const findPresenceDisabledByAdmin = jest.fn();
const findUsersNotOffline = jest.fn();

jest.mock('@rocket.chat/core-services', () => ({
	api: { broadcast: (...args: unknown[]) => broadcast(...args) },
	Settings: { get: async (key: string) => settingValues[key] },
	ServiceClassInternal: class {
		onSettingChanged() {
			// no-op
		}

		onEvent() {
			// no-op
		}
	},
}));
jest.mock('@rocket.chat/models', () => ({
	Users: {
		findPresenceUsersByIds: (...args: unknown[]) => findPresenceUsersByIds(...args),
		findWithStatusVisibilityConfig: (...args: unknown[]) => findWithStatusVisibilityConfig(...args),
		findPresenceDisabledByAdmin: (...args: unknown[]) => findPresenceDisabledByAdmin(...args),
		findUsersNotOffline: (...args: unknown[]) => findUsersNotOffline(...args),
	},
}));

const cursor = (users: object[]) => ({ toArray: async () => users });
const flush = () => new Promise((resolve) => setImmediate(resolve));
const blocking = (id: string, blocked: string[]) => ({ _id: id, settings: { preferences: { statusVisibilityDenied: blocked } } });
const hiddenFrom = async (service: StatusVisibilityService, viewer: string | null) => {
	const scope = await service.getHiddenFrom(viewer);
	return scope.hideAll ? 'ALL' : hiddenIds(scope).sort();
};

describe('status visibility service', () => {
	let service: StatusVisibilityService;

	beforeEach(async () => {
		jest.resetAllMocks();
		settingValues.Accounts_StatusVisibility_Enabled = true;
		settingValues.Accounts_StatusVisibility_Admin_Enabled = true;
		settingValues.Accounts_UserStatus_Enabled = true;
		broadcast.mockResolvedValue(undefined);
		findPresenceUsersByIds.mockReturnValue(cursor([]));
		findWithStatusVisibilityConfig.mockReturnValue(cursor([]));
		findPresenceDisabledByAdmin.mockReturnValue(cursor([]));
		findUsersNotOffline.mockReturnValue(cursor([]));
		service = new StatusVisibilityService();
		await service.refresh();
	});

	it('hides a target from the viewers they blocked, and only from them', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await service.refresh();

		expect(await hiddenFrom(service, 'bruno')).toEqual(['ana']);
		expect(await hiddenFrom(service, 'carla')).toEqual([]);
	});

	it('never hides a target from themselves nor from an anonymous viewer', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['ana', 'bruno'])]));
		await service.refresh();

		expect(await hiddenFrom(service, 'ana')).toEqual([]);
		expect(await hiddenFrom(service, null)).toEqual([]);
	});

	it('drops an entry when a targeted refresh finds the block list gone', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await service.refresh(['ana']);
		expect(await hiddenFrom(service, 'bruno')).toEqual(['ana']);

		findWithStatusVisibilityConfig.mockReturnValue(cursor([]));
		findPresenceUsersByIds.mockReturnValue(cursor([{ _id: 'ana' }]));
		const affected = await service.refresh(['ana']);

		expect(await hiddenFrom(service, 'bruno')).toEqual([]);
		expect(affected.map(({ _id }) => _id)).toEqual(['ana']);
	});

	it('lists users with an active block list as restricted, only while the feature is on', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await service.refresh();

		expect(await service.getRestrictedUsers()).toEqual(['ana']);

		settingValues.Accounts_StatusVisibility_Enabled = false;
		await service.refresh();

		expect(await service.getRestrictedUsers()).toEqual([]);
	});

	it('reports the viewers on both sides of a block list change', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await service.refresh();

		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['carla'])]));
		await service.invalidate(['ana']);

		const [, payload] = broadcast.mock.calls.at(-1) as [string, { viewers?: string[] }];

		expect(payload.viewers?.sort()).toEqual(['bruno', 'carla']);
	});

	it('leaves the viewers unscoped when the whole mirror is invalidated', async () => {
		await service.invalidate();

		const [, payload] = broadcast.mock.calls.at(-1) as [string, { viewers?: string[] }];

		expect(payload.viewers).toBeUndefined();
	});

	it('clears everything when the setting is off and reports who became visible', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await service.refresh();

		settingValues.Accounts_StatusVisibility_Enabled = false;
		findPresenceUsersByIds.mockReturnValue(cursor([{ _id: 'ana' }]));
		const affected = await service.refresh();

		expect(affected.map(({ _id }) => _id)).toEqual(['ana']);
		expect(await hiddenFrom(service, 'bruno')).toEqual([]);
	});

	it('reports every user whose visibility may have changed, configured before or after', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await service.refresh();

		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('carla', ['bruno'])]));
		findPresenceUsersByIds.mockReturnValue(cursor([{ _id: 'ana' }]));
		const affected = await service.refresh();

		expect(affected.map(({ _id }) => _id).sort()).toEqual(['ana', 'carla']);
	});

	it('applies overlapping refreshes in order, so an older read never wins', async () => {
		const reads: Array<(users: object[]) => void> = [];
		findWithStatusVisibilityConfig.mockImplementation(() => ({
			toArray: () => new Promise((resolve) => reads.push(resolve as (users: object[]) => void)),
		}));

		const stale = service.refresh();
		const fresh = service.refresh(['ana']);

		await flush();
		expect(reads).toHaveLength(1);
		reads[0]([]);
		await stale;

		await flush();
		expect(reads).toHaveLength(2);
		reads[1]([blocking('ana', ['bruno'])]);
		await fresh;

		expect(await hiddenFrom(service, 'bruno')).toEqual(['ana']);
	});

	it('lists who hid their status from a given viewer', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno']), blocking('carla', ['bruno', 'diego'])]));
		await service.refresh();

		expect(await hiddenFrom(service, 'bruno')).toEqual(['ana', 'carla']);
		expect(await hiddenFrom(service, 'diego')).toEqual(['carla']);
		expect(await hiddenFrom(service, 'elena')).toEqual([]);
	});

	it('hides an admin-disabled user from every viewer, including one they never blocked', async () => {
		findPresenceDisabledByAdmin.mockReturnValue(cursor([{ _id: 'ana' }]));
		await service.refresh();

		expect(await hiddenFrom(service, 'bruno')).toEqual(['ana']);
		expect(await hiddenFrom(service, 'carla')).toEqual(['ana']);
		expect(await service.isPresenceDisabledFor('ana')).toBe(true);
		expect(await service.isPresenceDisabledFor('bruno')).toBe(false);
	});

	it('keeps the admin axis live while the per-user setting is off', async () => {
		settingValues.Accounts_StatusVisibility_Enabled = false;
		findPresenceDisabledByAdmin.mockReturnValue(cursor([{ _id: 'ana' }]));
		await service.refresh();

		expect(await hiddenFrom(service, 'bruno')).toEqual(['ana']);
	});

	it('hides an admin-disabled user from an anonymous viewer too', async () => {
		findPresenceDisabledByAdmin.mockReturnValue(cursor([{ _id: 'ana' }]));
		await service.refresh();

		expect(await hiddenFrom(service, null)).toEqual(['ana']);
	});

	it('unions both axes without repeating a target hidden by each', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno']), blocking('carla', ['bruno'])]));
		findPresenceDisabledByAdmin.mockReturnValue(cursor([{ _id: 'ana' }, { _id: 'diego' }]));
		await service.refresh();

		expect(await hiddenFrom(service, 'bruno')).toEqual(['ana', 'carla', 'diego']);
	});

	it('flags an admin-disabled user as restricted for the sync broadcast gate', async () => {
		findPresenceDisabledByAdmin.mockReturnValue(cursor([{ _id: 'ana' }]));
		await service.refresh();

		expect((await service.getRestrictedUsers()).sort()).toEqual(['ana']);
	});

	it('returns a user the admin just disabled among the affected users, so the listener can correct clients', async () => {
		findPresenceDisabledByAdmin.mockReturnValue(cursor([{ _id: 'ana' }]));

		const affected = await service.refresh(['ana']);

		expect(affected.map(({ _id }) => _id)).toEqual(['ana']);
	});

	it('still reports an admin-disabled target on a repeated refresh, since the listener refreshes again', async () => {
		findPresenceDisabledByAdmin.mockReturnValue(cursor([{ _id: 'ana' }]));
		await service.refresh(['ana']);

		const affected = await service.refresh(['ana']);

		expect(affected.map(({ _id }) => _id)).toEqual(['ana']);
	});

	it('does not report a target twice when it is both newly disabled and configured', async () => {
		findPresenceDisabledByAdmin.mockReturnValue(cursor([{ _id: 'ana' }]));
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		findPresenceUsersByIds.mockReturnValue(cursor([{ _id: 'ana' }]));

		const affected = await service.refresh(['ana']);

		expect(affected.map(({ _id }) => _id)).toEqual(['ana']);
	});

	it('rebroadcasts a user the admin re-enabled, so they do not stay stuck offline', async () => {
		findPresenceDisabledByAdmin.mockReturnValue(cursor([{ _id: 'ana' }]));
		await service.refresh();

		findPresenceDisabledByAdmin.mockReturnValue(cursor([]));
		findPresenceUsersByIds.mockReturnValue(cursor([{ _id: 'ana' }]));
		const affected = await service.refresh(['ana']);

		expect(await hiddenFrom(service, 'bruno')).toEqual([]);
		expect(affected.map(({ _id }) => _id)).toEqual(['ana']);
	});

	it('scopes a targeted refresh of the admin axis to the given targets', async () => {
		findPresenceDisabledByAdmin.mockReturnValue(cursor([{ _id: 'ana' }, { _id: 'diego' }]));
		await service.refresh();

		findPresenceDisabledByAdmin.mockReturnValue(cursor([]));
		await service.refresh(['ana']);

		expect(await hiddenFrom(service, 'bruno')).toEqual(['diego']);
		expect(findPresenceDisabledByAdmin).toHaveBeenLastCalledWith(['ana'], expect.anything());
	});

	it('hides everyone when presence is disabled workspace-wide', async () => {
		settingValues.Accounts_UserStatus_Enabled = false;
		findUsersNotOffline.mockReturnValue(cursor([{ _id: 'ana' }, { _id: 'bruno' }]));

		const affected = await service.refresh();

		expect(await hiddenFrom(service, 'bruno')).toEqual('ALL');
		expect(await hiddenFrom(service, null)).toEqual('ALL');
		expect(await service.isPresenceDisabledFor('carla')).toBe(true);
		expect(affected.map(({ _id }) => _id)).toEqual(['ana', 'bruno']);
	});

	it('reports everyone again on a repeated refresh while the workspace policy is on', async () => {
		settingValues.Accounts_UserStatus_Enabled = false;
		findUsersNotOffline.mockReturnValue(cursor([{ _id: 'ana' }]));
		await service.refresh();

		const affected = await service.refresh();

		expect(affected.map(({ _id }) => _id)).toEqual(['ana']);
	});

	it('skips both per-user queries while the workspace policy is on', async () => {
		settingValues.Accounts_UserStatus_Enabled = false;
		findUsersNotOffline.mockReturnValue(cursor([]));
		findWithStatusVisibilityConfig.mockClear();
		findPresenceDisabledByAdmin.mockClear();

		await service.refresh();

		expect(findWithStatusVisibilityConfig).not.toHaveBeenCalled();
		expect(findPresenceDisabledByAdmin).not.toHaveBeenCalled();
	});

	it('gives everyone their real presence back when the workspace policy is turned off', async () => {
		settingValues.Accounts_UserStatus_Enabled = false;
		findUsersNotOffline.mockReturnValue(cursor([{ _id: 'ana' }, { _id: 'bruno' }]));
		await service.refresh();

		settingValues.Accounts_UserStatus_Enabled = true;
		const affected = await service.refresh();

		expect(await hiddenFrom(service, 'bruno')).toEqual([]);
		expect(affected.map(({ _id }) => _id)).toEqual(['ana', 'bruno']);
	});

	it('does not apply an unscoped invalidation locally, so the listener pass still sees the transition', async () => {
		settingValues.Accounts_UserStatus_Enabled = false;
		findUsersNotOffline.mockReturnValue(cursor([{ _id: 'ana' }]));
		await service.refresh();

		settingValues.Accounts_UserStatus_Enabled = true;
		await service.invalidate();
		const affected = await service.refresh();

		expect(affected.map(({ _id }) => _id)).toEqual(['ana']);
	});

	it('broadcasts to every viewer when a target is invalidated with allViewers', async () => {
		await service.invalidate(['ana'], { allViewers: true });

		expect(broadcast).toHaveBeenCalledWith('presence.invalidateVisibility', { targets: ['ana'], viewers: undefined });
	});

	describe('admin exception list', () => {
		const target = (chosen: string[]) => ({
			_id: 'target',
			settings: { preferences: { statusVisibilityDenied: chosen } },
			statusVisibilityDeniedByAdmin: ['imposed'],
		});

		beforeEach(async () => {
			findWithStatusVisibilityConfig.mockReturnValue(cursor([target([])]));
			await service.refresh();
		});

		it('should union the admin list with the user list', async () => {
			findWithStatusVisibilityConfig.mockReturnValue(cursor([target(['chosen'])]));

			await service.refresh();

			expect(await hiddenFrom(service, 'chosen')).toEqual(['target']);
			expect(await hiddenFrom(service, 'imposed')).toEqual(['target']);
			expect(await hiddenFrom(service, 'bystander')).toEqual([]);
		});

		it('should keep the admin list when Accounts_StatusVisibility_Enabled is off', async () => {
			settingValues.Accounts_StatusVisibility_Enabled = false;
			findWithStatusVisibilityConfig.mockReturnValue(cursor([target(['chosen'])]));

			await service.refresh();

			expect(await hiddenFrom(service, 'imposed')).toEqual(['target']);
			expect(await hiddenFrom(service, 'chosen')).toEqual([]);
		});

		it('flags a target hidden only by an admin exception as restricted for the sync broadcast gate', async () => {
			await service.refresh();

			expect((await service.getRestrictedUsers()).sort()).toEqual(['target']);
		});
	});

	describe('with the admin status hiding disabled, by setting or by a license that forces it off', () => {
		beforeEach(() => {
			settingValues.Accounts_StatusVisibility_Admin_Enabled = false;
		});

		it('reads no user at all, so a disabled feature costs no query', async () => {
			findWithStatusVisibilityConfig.mockClear();
			findPresenceDisabledByAdmin.mockClear();

			await service.refresh();

			expect(findWithStatusVisibilityConfig).not.toHaveBeenCalled();
			expect(findPresenceDisabledByAdmin).not.toHaveBeenCalled();
		});

		it('hides nobody, whatever rules the users and the admin had stored', async () => {
			findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
			findPresenceDisabledByAdmin.mockReturnValue(cursor([{ _id: 'target' }]));

			await service.refresh();

			expect(await hiddenFrom(service, 'bruno')).toEqual([]);
			expect(await service.isPresenceDisabledFor('target')).toBe(false);
			expect(await service.getRestrictedUsers()).toEqual([]);
		});

		it('still hides everyone when the workspace turned the user status off', async () => {
			settingValues.Accounts_UserStatus_Enabled = false;

			await service.refresh();

			expect(await hiddenFrom(service, 'bruno')).toEqual('ALL');
		});

		it('reports every presence when the workspace turns the user status back on', async () => {
			settingValues.Accounts_UserStatus_Enabled = false;
			await service.refresh();

			settingValues.Accounts_UserStatus_Enabled = true;
			findUsersNotOffline.mockReturnValue(cursor([{ _id: 'ana' }]));

			expect(await service.refresh()).toEqual([{ _id: 'ana' }]);
		});

		it('reports the users it stops hiding so their real presence is broadcast again', async () => {
			settingValues.Accounts_StatusVisibility_Admin_Enabled = true;
			findPresenceDisabledByAdmin.mockReturnValue(cursor([{ _id: 'target' }]));
			await service.refresh();

			settingValues.Accounts_StatusVisibility_Admin_Enabled = false;
			findPresenceUsersByIds.mockReturnValue(cursor([{ _id: 'target' }]));

			expect(await service.refresh()).toEqual([{ _id: 'target' }]);
			expect(findPresenceUsersByIds).toHaveBeenCalledWith(['target'], expect.anything());
		});
	});
});
