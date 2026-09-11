import { createDocumentMapStore, toRecordId } from './DocumentMapStore';

const hexId = '6a7fc7b8376b837b4b8aa6c3';
const binaryId = Uint8Array.from(hexId.match(/../g) ?? [], (byte) => parseInt(byte, 16));

interface ITestRecord {
	_id: string;
	rid: string;
}

const fromBinary = { _id: binaryId as unknown as string, rid: hexId };
const fromString = { _id: hexId, rid: hexId };

describe('cachedStores/DocumentMapStore', () => {
	describe('toRecordId', () => {
		it('should keep a string id as it is', () => {
			expect(toRecordId(hexId)).toBe(hexId);
		});

		it('should read the hexadecimal id out of a binary id', () => {
			expect(toRecordId(binaryId)).toBe(hexId);
		});
	});

	describe('createDocumentMapStore', () => {
		it('should store a document carrying a binary id under its hexadecimal id', () => {
			const store = createDocumentMapStore<ITestRecord>();

			store.getState().store(fromBinary);

			expect([...store.getState().records.keys()]).toEqual([hexId]);
			expect(store.getState().has(hexId)).toBe(true);
			expect(store.getState().has(fromBinary._id)).toBe(true);
			expect(store.getState().get(hexId)?.rid).toBe(hexId);
		});

		it('should not store the same document twice when its id arrives in different representations', () => {
			const store = createDocumentMapStore<ITestRecord>();

			store.getState().store(fromBinary);
			store.getState().store(fromString);

			expect(store.getState().records.size).toBe(1);
		});

		it('should not duplicate a document when many records are stored at once', () => {
			const store = createDocumentMapStore<ITestRecord>();

			store.getState().storeMany([fromBinary, fromString]);

			expect(store.getState().records.size).toBe(1);
		});

		it('should collapse the records of a cache written with mixed representations', () => {
			const store = createDocumentMapStore<ITestRecord>();

			store.getState().replaceAll([fromString, fromBinary, fromBinary, fromString]);

			expect(store.getState().records.size).toBe(1);
		});

		it('should delete a document by any representation of its id', () => {
			const store = createDocumentMapStore<ITestRecord>();

			store.getState().store(fromBinary);
			store.getState().delete(fromBinary._id);

			expect(store.getState().records.size).toBe(0);
		});
	});
});
