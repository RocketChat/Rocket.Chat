import type { ISetting } from '@rocket.chat/core-typings';
import type { Db } from 'mongodb';

import { SettingsRaw } from './Settings';

// `BaseRaw` imports `..`, whose barrel pulls in every model and cycles back here.
jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: class {},
}));

jest.mock(
	'@rocket.chat/tracing',
	() => ({
		traceInstanceMethods: <T>(instance: T) => instance,
	}),
	{ virtual: true },
);

const setting = {
	_id: 'test_setting',
	_updatedAt: new Date('2020-01-01'),
	type: 'string',
	value: 'hello',
	i18nLabel: 'test_setting',
} as unknown as ISetting;

const setupModel = (stored: unknown = { _id: 'test_setting' }) => {
	const findOneAndUpdate = jest.fn().mockResolvedValue(stored);
	const db = {
		collection: () => ({
			findOneAndUpdate,
			createIndexes: jest.fn().mockResolvedValue(undefined),
			find: jest.fn(),
			findOne: jest.fn(),
		}),
	} as unknown as Db;

	return { model: new SettingsRaw(db), findOneAndUpdate };
};

describe('SettingsRaw.insertIfNotExists', () => {
	it('should not include $set in the MongoDB update — only $setOnInsert — so existing documents are not modified', async () => {
		const { model, findOneAndUpdate } = setupModel();

		await model.insertIfNotExists(setting);

		expect(findOneAndUpdate).toHaveBeenCalledTimes(1);
		const updateArg = findOneAndUpdate.mock.calls[0][1];
		expect(Object.keys(updateArg)).toEqual(['$setOnInsert']);
		expect(updateArg.$set).toBeUndefined();
		expect(updateArg.$setOnInsert).toBeDefined();
	});

	it('should filter by _id and upsert, returning the document after', async () => {
		const { model, findOneAndUpdate } = setupModel();

		await model.insertIfNotExists(setting);

		const [filter, , options] = findOneAndUpdate.mock.calls[0];
		expect(filter).toEqual({ _id: 'test_setting' });
		expect(options).toEqual({ upsert: true, returnDocument: 'after' });
	});

	it('should put a fresh _updatedAt on insert and drop the one from the argument', async () => {
		const { model, findOneAndUpdate } = setupModel();
		const before = Date.now();

		await model.insertIfNotExists(setting);

		const updateArg = findOneAndUpdate.mock.calls[0][1];
		expect(updateArg.$setOnInsert._updatedAt).toBeInstanceOf(Date);
		expect(updateArg.$setOnInsert._updatedAt.getTime()).toBeGreaterThanOrEqual(before);
		expect(updateArg.$setOnInsert._updatedAt.getTime()).not.toBe(setting._updatedAt.getTime());
		expect(updateArg.$setOnInsert).not.toHaveProperty('_id');
	});

	it('should return the stored document', async () => {
		const stored = { _id: 'test_setting', value: 'stored' };
		const { model } = setupModel(stored);

		await expect(model.insertIfNotExists(setting)).resolves.toBe(stored);
	});
});
