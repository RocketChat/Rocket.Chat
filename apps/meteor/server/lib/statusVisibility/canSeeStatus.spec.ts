import { canSeeStatus, getHiddenFrom, hasStatusRestrictions, refreshStatusVisibility } from './canSeeStatus';
import { resolveUsersByIds, resolveUsersByUsernames } from './resolveUsers';

const getSetting = jest.fn();
const findPresenceUsersByIds = jest.fn();
const findWithStatusVisibilityConfig = jest.fn();
const usersByUsernames = jest.fn();
const usersByIds = jest.fn();

jest.mock('@rocket.chat/core-services', () => ({
	api: { broadcast: jest.fn() },
	Settings: { get: (key: string) => getSetting(key) },
}));
jest.mock('@rocket.chat/models', () => ({
	Users: {
		findPresenceUsersByIds: (...args: unknown[]) => findPresenceUsersByIds(...args),
		findWithStatusVisibilityConfig: (...args: unknown[]) => findWithStatusVisibilityConfig(...args),
		findByUsernames: (...args: unknown[]) => usersByUsernames(...args),
		findByIds: (...args: unknown[]) => usersByIds(...args),
	},
}));

const cursor = (users: object[]) => ({ toArray: async () => users });
const blocking = (id: string, blocked: string[]) => ({ _id: id, settings: { preferences: { statusVisibilityDenied: blocked } } });

describe('status visibility mirror', () => {
	beforeEach(async () => {
		jest.resetAllMocks();
		getSetting.mockReturnValue(true);
		findPresenceUsersByIds.mockReturnValue(cursor([]));
		findWithStatusVisibilityConfig.mockReturnValue(cursor([]));
		await refreshStatusVisibility();
	});

	it('hides a target from the viewers they blocked, and only from them', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await refreshStatusVisibility();

		expect(canSeeStatus('bruno', 'ana')).toBe(false);
		expect(canSeeStatus('carla', 'ana')).toBe(true);
		expect(canSeeStatus('bruno', 'carla')).toBe(true);
	});

	it('never hides a target from themselves nor from an anonymous viewer', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['ana', 'bruno'])]));
		await refreshStatusVisibility();

		expect(canSeeStatus('ana', 'ana')).toBe(true);
		expect(canSeeStatus(null, 'ana')).toBe(true);
	});

	it('drops an entry when a targeted refresh finds the block list gone', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await refreshStatusVisibility(['ana']);
		expect(canSeeStatus('bruno', 'ana')).toBe(false);

		findWithStatusVisibilityConfig.mockReturnValue(cursor([]));
		findPresenceUsersByIds.mockReturnValue(cursor([{ _id: 'ana' }]));
		const affected = await refreshStatusVisibility(['ana']);

		expect(canSeeStatus('bruno', 'ana')).toBe(true);
		expect(affected.map(({ _id }) => _id)).toEqual(['ana']);
	});

	it('keeps hiding while a targeted refresh is still querying', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await refreshStatusVisibility(['ana']);

		const refreshing = refreshStatusVisibility(['ana']);

		expect(canSeeStatus('bruno', 'ana')).toBe(false);

		await refreshing;
	});

	it('flags users with an active block list, only while the feature is on', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await refreshStatusVisibility();

		expect(hasStatusRestrictions('ana')).toBe(true);
		expect(hasStatusRestrictions('carla')).toBe(false);

		getSetting.mockReturnValue(false);
		await refreshStatusVisibility();

		expect(hasStatusRestrictions('ana')).toBe(false);
	});

	it('stops hiding once the setting turns off and the mirror catches up', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await refreshStatusVisibility();
		expect(canSeeStatus('bruno', 'ana')).toBe(false);

		getSetting.mockReturnValue(false);
		await refreshStatusVisibility();

		expect(canSeeStatus('bruno', 'ana')).toBe(true);
	});

	it('clears everything when the setting is off and reports who became visible', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await refreshStatusVisibility();

		getSetting.mockReturnValue(false);
		findPresenceUsersByIds.mockReturnValue(cursor([{ _id: 'ana' }]));
		const affected = await refreshStatusVisibility();

		expect(affected.map(({ _id }) => _id)).toEqual(['ana']);

		getSetting.mockReturnValue(true);
		expect(canSeeStatus('bruno', 'ana')).toBe(true);
	});

	it('reports every user whose visibility may have changed, configured before or after', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await refreshStatusVisibility();

		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('carla', ['bruno'])]));
		findPresenceUsersByIds.mockReturnValue(cursor([{ _id: 'ana' }]));
		const affected = await refreshStatusVisibility();

		expect(affected.map(({ _id }) => _id).sort()).toEqual(['ana', 'carla']);
	});

	it('lists who hid their status from a given viewer, and only while the feature is on', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno']), blocking('carla', ['bruno', 'diego'])]));
		await refreshStatusVisibility();

		expect(getHiddenFrom('bruno').sort()).toEqual(['ana', 'carla']);
		expect(getHiddenFrom('diego')).toEqual(['carla']);
		expect(getHiddenFrom('elena')).toEqual([]);
		expect(getHiddenFrom(null)).toEqual([]);

		getSetting.mockReturnValue(false);
		await refreshStatusVisibility();

		expect(getHiddenFrom('bruno')).toEqual([]);
	});

	it('never hides a target from themselves', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['ana', 'bruno'])]));
		await refreshStatusVisibility();

		expect(getHiddenFrom('ana')).toEqual([]);
	});

	it('pairs every resolved id with its username in either direction', async () => {
		usersByUsernames.mockReturnValue([
			{ _id: 'bbb222', username: 'bruno' },
			{ _id: 'ccc333', username: 'carla' },
		]);

		const byUsername = await resolveUsersByUsernames(['bruno', 'ghost', 'carla']);

		expect(byUsername.usernames).toEqual(['bruno', 'carla']);
		expect(byUsername.ids).toEqual(['bbb222', 'ccc333']);

		usersByIds.mockReturnValue([{ _id: 'bbb222', username: 'bruno' }]);

		const byId = await resolveUsersByIds(['bbb222', 'missing']);

		expect(byId.usernames).toEqual(['bruno']);
		expect(byId.ids).toEqual(['bbb222']);
	});

	it('resolves to empty arrays without touching the database', async () => {
		const { ids, usernames } = await resolveUsersByUsernames([]);

		expect(ids).toEqual([]);
		expect(usernames).toEqual([]);
		expect(usersByUsernames).not.toHaveBeenCalled();
		expect((await resolveUsersByIds([])).ids).toEqual([]);
		expect(usersByIds).not.toHaveBeenCalled();
	});
});
