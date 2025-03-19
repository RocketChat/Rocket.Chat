import { AsyncStatePhase } from '../asyncState';
import { RecordList } from './RecordList'; // Adjust the import path if necessary

type TestItem = {
	_id: string;
	_updatedAt?: Date;
};

describe('RecordList', () => {
	let recordList: RecordList<TestItem>;

	beforeEach(() => {
		recordList = new RecordList();
		recordList.emit = jest.fn();
	});

	test('should initialize with loading phase', () => {
		expect(recordList.phase).toBe(AsyncStatePhase.LOADING);
		expect(recordList.items).toEqual([]);
	});

	it('should insert a new item and emit an "inserted" event', async () => {
		const item = { _id: '1', _updatedAt: new Date() };
		await recordList.handle(item);

		expect(recordList.items).toContainEqual(item);
		expect(recordList.emit).toHaveBeenCalledWith('1/inserted', item);
	});

	it('should update an existing item and emit an "updated" event', async () => {
		const item = { _id: '1', _updatedAt: new Date() };
		await recordList.handle(item);

		const updatedItem = { _id: '1', _updatedAt: new Date() };
		await recordList.handle(updatedItem);

		expect(recordList.items).toContainEqual(updatedItem);
		expect(recordList.items.length).toBe(1);
		expect(recordList.emit).toHaveBeenCalledWith('1/updated', updatedItem);
	});

	it('should delete an item and emit a "deleted" event', async () => {
		const item = { _id: '1', _updatedAt: new Date() };
		await recordList.handle(item);
		await recordList.remove('1');

		expect(recordList.items).not.toContainEqual(item);
		expect(recordList.emit).toHaveBeenCalledWith('1/deleted');
	});

	it('should emit "errored" event if an error occurs during mutation', async () => {
		const error = new Error('Mutation error');
		const getInfo = jest.fn().mockRejectedValue(error);

		await recordList.batchHandle(getInfo);

		expect(recordList.emit).toHaveBeenCalledWith('errored', error);
	});

	test('should batch handle multiple items', async () => {
		const changes = {
			items: [
				{ _id: '1', _updatedAt: new Date() },
				{ _id: '2', _updatedAt: new Date() },
			],
			itemCount: 2,
		};

		const getInfo = jest.fn().mockResolvedValue(changes);

		await recordList.batchHandle(getInfo);

		expect(recordList.items).toEqual(changes.items);
		expect(recordList.itemCount).toBe(changes.itemCount);
		expect(recordList.emit).toHaveBeenCalledWith('1/inserted', changes.items[0]);
		expect(recordList.emit).toHaveBeenCalledWith('2/inserted', changes.items[1]);
		expect(recordList.emit).toHaveBeenCalledWith('mutated', true);
	});

	test('should fallback to index count if itemCount is not present', async () => {
		const batchData = async () => ({
			items: [
				{ _id: '1', _updatedAt: new Date() },
				{ _id: '2', _updatedAt: new Date() },
			],
		});
		await recordList.batchHandle(batchData);
		expect(recordList.itemCount).toBe(2);
	});

	test('should consider itemCount even if value is 0', async () => {
		const batchData = async () => ({
			items: [
				{ _id: '1', _updatedAt: new Date() },
				{ _id: '2', _updatedAt: new Date() },
			],
			itemCount: 0,
		});
		await recordList.batchHandle(batchData);
		expect(recordList.itemCount).toBe(0);
	});

	test('should clear all items and emit cleared event', async () => {
		const item = { _id: '1', _updatedAt: new Date() };

		await await recordList.handle(item);
		await recordList.clear();

		expect(recordList.items).toEqual([]);
		expect(recordList.itemCount).toBe(0);
		expect(recordList.items.length).toBe(0);
		expect(recordList.emit).toHaveBeenCalledWith('cleared');
	});

	it('should prune items based on match criteria and emit delete events', async () => {
		const item1 = { _id: '1', _updatedAt: new Date() };
		const item2 = { _id: '2', _updatedAt: new Date() };
		await await recordList.handle(item1);
		await await recordList.handle(item2);

		const matchCriteria = (item: TestItem) => item._id === '1';
		await recordList.prune(matchCriteria);

		expect(recordList.items).not.toContainEqual(item1);
		expect(recordList.emit).toHaveBeenCalledWith('1/deleted');
		expect(recordList.items).toContainEqual(item2);
	});

	test('should sort items based on _updatedAt', async () => {
		const oldItem = { _id: '2', _updatedAt: new Date(Date.now() - 1000) };
		await await recordList.handle(oldItem);

		const newItem = { _id: '1', _updatedAt: new Date() };
		await await recordList.handle(newItem);

		expect(recordList.items[0]).toBe(newItem);
	});
});
