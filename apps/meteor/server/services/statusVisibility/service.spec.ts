import { StatusVisibilityService } from './service';

const getSetting = jest.fn();
const broadcast = jest.fn();
const findPresenceUsersByIds = jest.fn();
const findWithStatusVisibilityConfig = jest.fn();

jest.mock('@rocket.chat/core-services', () => ({
	api: { broadcast: (...args: unknown[]) => broadcast(...args) },
	Settings: { get: (key: string) => getSetting(key) },
	ServiceClassInternal: class {
		onSettingChanged() {
			// no-op
		}
	},
}));
jest.mock('@rocket.chat/models', () => ({
	Users: {
		findPresenceUsersByIds: (...args: unknown[]) => findPresenceUsersByIds(...args),
		findWithStatusVisibilityConfig: (...args: unknown[]) => findWithStatusVisibilityConfig(...args),
	},
}));

const cursor = (users: object[]) => ({ toArray: async () => users });
const flush = () => new Promise((resolve) => setImmediate(resolve));
const blocking = (id: string, blocked: string[]) => ({ _id: id, settings: { preferences: { statusVisibilityDenied: blocked } } });

describe('status visibility service', () => {
	let service: StatusVisibilityService;

	beforeEach(async () => {
		jest.resetAllMocks();
		getSetting.mockReturnValue(true);
		broadcast.mockResolvedValue(undefined);
		findPresenceUsersByIds.mockReturnValue(cursor([]));
		findWithStatusVisibilityConfig.mockReturnValue(cursor([]));
		service = new StatusVisibilityService();
		await service.refresh();
	});

	it('hides a target from the viewers they blocked, and only from them', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await service.refresh();

		expect(await service.getHiddenFrom('bruno')).toEqual(['ana']);
		expect(await service.getHiddenFrom('carla')).toEqual([]);
	});

	it('never hides a target from themselves nor from an anonymous viewer', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['ana', 'bruno'])]));
		await service.refresh();

		expect(await service.getHiddenFrom('ana')).toEqual([]);
		expect(await service.getHiddenFrom(null)).toEqual([]);
	});

	it('drops an entry when a targeted refresh finds the block list gone', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await service.refresh(['ana']);
		expect(await service.getHiddenFrom('bruno')).toEqual(['ana']);

		findWithStatusVisibilityConfig.mockReturnValue(cursor([]));
		findPresenceUsersByIds.mockReturnValue(cursor([{ _id: 'ana' }]));
		const affected = await service.refresh(['ana']);

		expect(await service.getHiddenFrom('bruno')).toEqual([]);
		expect(affected.map(({ _id }) => _id)).toEqual(['ana']);
	});

	it('flags users with an active block list, only while the feature is on', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno'])]));
		await service.refresh();

		expect(await service.hasRestrictions('ana')).toBe(true);
		expect(await service.hasRestrictions('carla')).toBe(false);

		getSetting.mockReturnValue(false);
		await service.refresh();

		expect(await service.hasRestrictions('ana')).toBe(false);
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

		getSetting.mockReturnValue(false);
		findPresenceUsersByIds.mockReturnValue(cursor([{ _id: 'ana' }]));
		const affected = await service.refresh();

		expect(affected.map(({ _id }) => _id)).toEqual(['ana']);
		expect(await service.getHiddenFrom('bruno')).toEqual([]);
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

		expect(await service.getHiddenFrom('bruno')).toEqual(['ana']);
	});

	it('lists who hid their status from a given viewer', async () => {
		findWithStatusVisibilityConfig.mockReturnValue(cursor([blocking('ana', ['bruno']), blocking('carla', ['bruno', 'diego'])]));
		await service.refresh();

		expect((await service.getHiddenFrom('bruno')).sort()).toEqual(['ana', 'carla']);
		expect(await service.getHiddenFrom('diego')).toEqual(['carla']);
		expect(await service.getHiddenFrom('elena')).toEqual([]);
	});
});
