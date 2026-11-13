import type { Db } from 'mongodb';

import { LoginServiceConfigurationRaw } from './LoginServiceConfiguration';

// `BaseRaw` imports `..`, whose barrel pulls in every model and cycles back here.
jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: class {},
}));

const findOneAndUpdate = jest.fn();
const db = { collection: () => ({ createIndexes: jest.fn().mockResolvedValue(undefined), findOneAndUpdate }) } as unknown as Db;

describe('createOrUpdateService', () => {
	beforeEach(() => findOneAndUpdate.mockReset().mockResolvedValue({ _id: 'service-id' }));

	// Every instance reacts to the same setting change, so concurrent saves of a new service must not race on the unique index
	it('should save the service in a single upsert keyed by its lowercase name', async () => {
		const id = await new LoginServiceConfigurationRaw(db).createOrUpdateService('Apple', { enabled: true });

		expect(id).toBe('service-id');
		expect(findOneAndUpdate).toHaveBeenCalledTimes(1);
		const [filter, update, options] = findOneAndUpdate.mock.calls[0];
		expect(filter).toEqual({ service: 'apple' });
		expect(update.$set).toEqual({ enabled: true, service: 'apple' });
		expect(update.$setOnInsert._id).toEqual(expect.any(String));
		expect(options).toMatchObject({ upsert: true, returnDocument: 'after' });
	});
});
