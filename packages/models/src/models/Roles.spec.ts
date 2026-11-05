import type { Collection, Db, Filter } from 'mongodb';

import { RolesRaw } from './Roles';

// `Roles` reads `Subscriptions` and `Users` off the barrel and `BaseRaw` reads
// `getCollectionName` off it, so loading the real one pulls in every model and cycles back
// here.
jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: class {},
	Subscriptions: {},
	Users: {},
}));

const find = jest.fn();
const countDocuments = jest.fn();

const newRolesModel = (): RolesRaw => new RolesRaw({ collection: () => ({ find, countDocuments }) } as unknown as Db);

const filterSentToDriver = (mock: jest.Mock): Filter<unknown> | undefined => mock.mock.calls.at(-1)?.[0];

describe('custom roles', () => {
	beforeEach(() => {
		find.mockReset().mockReturnValue({} as unknown as Collection<any>);
		countDocuments.mockReset().mockResolvedValue(0);
	});

	it('should treat a role without the `protected` field as custom', async () => {
		const roles = newRolesModel();

		roles.findCustomRoles();
		await roles.countCustomRoles();

		// roles that are older than the `protected` field do not carry it at all, so an
		// exact `protected: false` match leaves them out of both the list and the count
		expect(filterSentToDriver(find)).toEqual({ protected: { $ne: true } });
		expect(filterSentToDriver(countDocuments)).toEqual({ protected: { $ne: true } });
	});

	it('should count custom roles with the same filter it lists them with', async () => {
		const roles = newRolesModel();

		roles.findCustomRoles();
		await roles.countCustomRoles();

		expect(filterSentToDriver(countDocuments)).toEqual(filterSentToDriver(find));
	});
});
