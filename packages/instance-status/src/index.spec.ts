import type { IInstanceStatus } from '@rocket.chat/core-typings';
import type { Collection } from 'mongodb';

const mockLoggerError = jest.fn();

jest.mock('@rocket.chat/logger', () => ({
	Logger: class {
		error = mockLoggerError;
	},
}));

const createDeferred = () => {
	let resolve!: () => void;
	const promise = new Promise<void>((res) => {
		resolve = res;
	});
	return { promise, resolve };
};

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('InstanceStatus expiration index', () => {
	const indexesMock = jest.fn();
	const dropIndexMock = jest.fn();
	const createIndexMock = jest.fn();

	let InstanceStatus: typeof import('./index.js').InstanceStatus;
	let exitListeners: ReturnType<typeof process.listeners>;

	beforeEach(async () => {
		mockLoggerError.mockReset();
		indexesMock.mockReset().mockResolvedValue([]);
		dropIndexMock.mockReset().mockResolvedValue(undefined);
		createIndexMock.mockReset().mockResolvedValue('_updatedAt_1');

		jest.spyOn(global, 'setInterval').mockImplementation((() => ({}) as NodeJS.Timeout) as unknown as typeof setInterval);
		jest.spyOn(global, 'clearInterval').mockImplementation(() => undefined);
		exitListeners = process.listeners('exit');

		await jest.isolateModulesAsync(async () => {
			const { mockModel } = await import('@rocket.chat/models/testing');
			mockModel('InstanceStatus', {
				col: {
					indexes: indexesMock,
					dropIndex: dropIndexMock,
					createIndex: createIndexMock,
				} as Partial<Collection<IInstanceStatus>> as Collection<IInstanceStatus>,
				upsertInstance: jest.fn(),
			});

			({ InstanceStatus } = await import('./index.js'));
		});
	});

	afterEach(() => {
		process
			.listeners('exit')
			.filter((listener) => !exitListeners.includes(listener))
			.forEach((listener) => process.removeListener('exit', listener));
		jest.restoreAllMocks();
	});

	it('should create the index when it does not exist', async () => {
		await InstanceStatus.registerInstance('test', {});
		await flushPromises();

		expect(dropIndexMock).not.toHaveBeenCalled();
		expect(createIndexMock).toHaveBeenCalledWith({ _updatedAt: 1 }, { expireAfterSeconds: InstanceStatus.indexExpire });
	});

	it('should keep the index when its expiration is up to date', async () => {
		indexesMock.mockResolvedValue([{ name: '_updatedAt_1', key: { _updatedAt: 1 }, expireAfterSeconds: InstanceStatus.indexExpire }]);

		await InstanceStatus.registerInstance('test', {});
		await flushPromises();

		expect(dropIndexMock).not.toHaveBeenCalled();
		expect(createIndexMock).not.toHaveBeenCalled();
	});

	it('should create the new index only after the outdated one is dropped', async () => {
		const drop = createDeferred();
		indexesMock.mockResolvedValue([{ name: '_updatedAt_1', key: { _updatedAt: 1 }, expireAfterSeconds: InstanceStatus.indexExpire + 60 }]);
		dropIndexMock.mockReturnValue(drop.promise);

		await InstanceStatus.registerInstance('test', {});
		await flushPromises();

		expect(dropIndexMock).toHaveBeenCalledWith('_updatedAt_1');
		expect(createIndexMock).not.toHaveBeenCalled();

		drop.resolve();
		await flushPromises();

		expect(createIndexMock).toHaveBeenCalledWith({ _updatedAt: 1 }, { expireAfterSeconds: InstanceStatus.indexExpire });
	});

	it('should log the error when the index cannot be created', async () => {
		const error = new Error('Index already exists with different options');
		createIndexMock.mockRejectedValue(error);

		await InstanceStatus.registerInstance('test', {});
		await flushPromises();

		expect(mockLoggerError).toHaveBeenCalledWith(expect.objectContaining({ err: error }));
	});

	it('should check the index only once', async () => {
		const lookup = createDeferred();
		indexesMock.mockReturnValue(lookup.promise.then(() => []));

		await InstanceStatus.registerInstance('test', {});
		await InstanceStatus.registerInstance('test', {});

		expect(indexesMock).toHaveBeenCalledTimes(1);

		lookup.resolve();
		await flushPromises();

		expect(indexesMock).toHaveBeenCalledTimes(1);
		expect(createIndexMock).toHaveBeenCalledTimes(1);
	});
});
