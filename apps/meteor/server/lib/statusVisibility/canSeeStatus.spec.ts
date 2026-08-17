import { canSeeStatus, hasStatusRestrictions, refreshStatusVisibility } from './canSeeStatus';

const getSetting = jest.fn();
const findPresenceUsersByIds = jest.fn();
const findWithStatusVisibilityConfig = jest.fn();

jest.mock('../../settings/cached', () => ({
	settings: { get: (key: string) => getSetting(key) },
}));
jest.mock('@rocket.chat/models', () => ({
	Users: {
		findPresenceUsersByIds: (...args: unknown[]) => findPresenceUsersByIds(...args),
		findWithStatusVisibilityConfig: (...args: unknown[]) => findWithStatusVisibilityConfig(...args),
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
		expect(hasStatusRestrictions('ana')).toBe(false);
	});

	it('stops hiding the moment the setting turns off, before any refresh runs', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await refreshStatusVisibility();
		expect(canSeeStatus('bruno', 'ana')).toBe(false);

		getSetting.mockReturnValue(false);

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
});
