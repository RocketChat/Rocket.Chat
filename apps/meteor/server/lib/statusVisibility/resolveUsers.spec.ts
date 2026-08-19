import { resolveUsersByIds, resolveUsersByUsernames } from './resolveUsers';

const usersByUsernames = jest.fn();
const usersByIds = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	Users: {
		findByUsernames: (...args: unknown[]) => usersByUsernames(...args),
		findByIds: (...args: unknown[]) => usersByIds(...args),
	},
}));

describe('status visibility user resolution', () => {
	beforeEach(() => {
		jest.resetAllMocks();
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
