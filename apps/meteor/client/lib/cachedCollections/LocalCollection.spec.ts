import type { StoreApi, UseBoundStore } from 'zustand';
import { create } from 'zustand';

import { LocalCollection } from './LocalCollection';

const docA = { _id: 'a', foo: 1 };
const docB = { _id: 'b', foo: 2 };

let store: UseBoundStore<StoreApi<{ records: Map<string, any> }>>;
let collection: LocalCollection<typeof docA>;

beforeEach(() => {
	store = create(() => ({
		records: new Map(),
	}));
	collection = new LocalCollection(store);
});

describe('insert', () => {
	it('inserts a document', () => {
		const id = collection.insert({ ...docA });
		expect(id).toBe('a');
		expect(store.getState().records.size).toBe(1);
		expect(store.getState().records.has('a')).toBe(true);
	});

	it('throws on duplicate _id', () => {
		collection.insert({ ...docA });
		expect(() => collection.insert({ ...docA })).toThrow('Duplicate _id');
	});

	it('throws if _id is missing', () => {
		expect(() => collection.insert({ foo: 1 } as any)).toThrow('Document must have an _id field');
	});

	it('calls callback if provided', (done) => {
		collection.insert({ ...docB }, (err, id) => {
			expect(err).toBeNull();
			expect(id).toBe('b');
			done();
		});
	});
});

describe('insertAsync', () => {
	it('inserts a document asynchronously', async () => {
		const id = await collection.insertAsync({ ...docA });
		expect(id).toBe('a');
		expect(store.getState().records.has('a')).toBe(true);
	});
});

describe('find/findOne/findOneAsync', () => {
	beforeEach(() => {
		collection.insert({ ...docA });
		collection.insert({ ...docB });
	});

	it('find returns a Cursor', () => {
		const cursor = collection.find();
		expect(cursor).toBeInstanceOf(Object);
		expect(cursor.fetch()).toHaveLength(2);
	});

	it('findOne returns the first matching doc', () => {
		const doc = collection.findOne({ _id: 'a' });
		expect(doc._id).toBe('a');
	});

	it('findOne returns undefined if not found', () => {
		const doc = collection.findOne({ _id: 'z' });
		expect(doc).toBeUndefined();
	});

	it('findOneAsync returns the first matching doc', async () => {
		const doc = await collection.findOneAsync({ _id: 'b' });
		expect(doc._id).toBe('b');
	});
});

describe('countDocuments/estimatedDocumentCount', () => {
	beforeEach(() => {
		collection.insert({ ...docA });
		collection.insert({ ...docB });
	});

	it('countDocuments returns count', async () => {
		const count = await collection.countDocuments();
		expect(count).toBe(2);
	});

	it('estimatedDocumentCount returns count', async () => {
		const count = await collection.estimatedDocumentCount();
		expect(count).toBe(2);
	});
});

describe('remove/removeAsync', () => {
	beforeEach(() => {
		collection.insert({ ...docA });
		collection.insert({ ...docB });
	});

	it('removes documents matching selector', () => {
		const removed = collection.remove({ _id: 'a' });
		expect(removed).toBe(1);
		expect(store.getState().records.size).toBe(1);
		expect(store.getState().records.has('a')).toBe(false);
	});

	it('removes all documents with empty selector', () => {
		const removed = collection.remove({});
		expect(removed).toBe(2);
		expect(store.getState().records.size).toBe(0);
	});

	it('calls callback if provided', (done) => {
		collection.remove({ _id: 'b' }, (err, count) => {
			expect(err).toBeNull();
			expect(count).toBe(1);
			done();
		});
	});

	it('removeAsync removes documents asynchronously', async () => {
		const removed = await collection.removeAsync({ _id: 'a' });
		expect(removed).toBe(1);
		expect(store.getState().records.size).toBe(1);
	});
});

describe('update/updateAsync', () => {
	beforeEach(() => {
		collection.insert({ ...docA });
	});

	it('updates a document', () => {
		const result = collection.update({ _id: 'a' }, { $set: { foo: 42 } });
		expect(result).toBe(1);
		expect(store.getState().records.get('a').foo).toBe(42);
	});

	it('does not update if selector does not match', () => {
		const result = collection.update({ _id: 'z' }, { $set: { foo: 99 } });
		expect(result).toBe(0);
		expect(store.getState().records.get('a').foo).toBe(1);
	});

	it('upserts if upsert option is set', () => {
		const result = collection.update({ _id: 'c' }, { $set: { foo: 7 } }, { upsert: true });
		expect(typeof result === 'object' ? result.numberAffected : result).toBe(1);
		expect(store.getState().records.has('c')).toBe(true);
	});

	it('calls callback if provided', (done) => {
		collection.update({ _id: 'a' }, { $set: { foo: 5 } }, (err, res) => {
			expect(err).toBeNull();
			expect(res).toBe(1);
			done();
		});
	});

	it('updateAsync updates a document asynchronously', async () => {
		const result = await collection.updateAsync({ _id: 'a' }, { $set: { foo: 100 } });
		expect(result).toBe(1);
		expect(store.getState().records.get('a').foo).toBe(100);
	});
});

describe('upsert/upsertAsync', () => {
	it('upsert inserts if not found', () => {
		const result = collection.upsert({ _id: 'd' }, { $set: { foo: 9 } });
		expect(typeof result === 'object' ? result.numberAffected : result).toBe(1);
		expect(store.getState().records.has('d')).toBe(true);
	});

	it('upsertAsync inserts if not found', async () => {
		const result = await collection.upsertAsync({ _id: 'e' }, { $set: { foo: 10 } });
		expect(typeof result === 'object' ? result.numberAffected : result).toBe(1);
		expect(store.getState().records.has('e')).toBe(true);
	});
});

describe('pause/resume observers', () => {
	it('pauseObservers sets paused and clones results', () => {
		const fakeQuery = { results: [{ _id: 'a' }], resultsSnapshot: null } as any;
		collection.queries.add(fakeQuery);
		collection.pauseObservers();
		expect(collection.paused).toBe(true);
		expect(fakeQuery.resultsSnapshot).toBeDefined();
	});

	it('resumeObserversClient resets paused', () => {
		const fakeQuery = {
			results: [{ _id: 'a' }],
			resultsSnapshot: [{ _id: 'a' }],
			ordered: false,
			dirty: true,
			cursor: { _getRawObjects: jest.fn(() => []) },
			projectionFn: (x: any) => x,
		} as any;
		collection.queries.add(fakeQuery);
		collection.paused = true;
		collection.resumeObserversClient();
		expect(collection.paused).toBe(false);
		expect(fakeQuery.resultsSnapshot).toBeNull();
	});

	it('resumeObserversServer resets paused', async () => {
		const fakeQuery = {
			results: [{ _id: 'a' }],
			resultsSnapshot: [{ _id: 'a' }],
			ordered: false,
			dirty: true,
			cursor: { _getRawObjects: jest.fn(() => []) },
			projectionFn: (x: any) => x,
		} as any;
		collection.queries.add(fakeQuery);
		collection.paused = true;
		await collection.resumeObserversServer();
		expect(collection.paused).toBe(false);
		expect(fakeQuery.resultsSnapshot).toBeNull();
	});
});

describe('saveOriginals/retrieveOriginals', () => {
	it('saveOriginals and retrieveOriginals', () => {
		collection.saveOriginals();
		expect(() => collection.saveOriginals()).toThrow();
		const originals = collection.retrieveOriginals();
		expect(originals).toBeInstanceOf(Map);
		expect(() => collection.retrieveOriginals()).toThrow();
	});
});

describe('internal error/edge cases', () => {
	it('throws on invalid modifier', () => {
		collection.insert({ ...docA });
		expect(() => collection.update({ _id: 'a' }, { $bad: { foo: 1 } } as any)).toThrow();
	});

	it('throws on forbidden field names', () => {
		expect(() => collection.insert({ _id: 'x', $bad: 1 } as any)).toThrow();
	});

	it('throws on changing _id', () => {
		collection.insert({ ...docA });
		expect(() => collection.update({ _id: 'a' }, { _id: 'newId' })).toThrow();
	});
});
