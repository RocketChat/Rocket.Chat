import { MeteorCollection } from './MeteorCollection';

describe('MeteorCollection', () => {
	let collection: MeteorCollection<{ value: number }>;
	let changes: jest.Mock;

	beforeEach(() => {
		collection = new MeteorCollection();
		changes = jest.fn();
		collection.onChange(changes);
	});

	it('reports the first set of an id as added and later sets as changed', () => {
		collection.set('a', { value: 1 });
		collection.set('a', { value: 2 });

		expect(changes.mock.calls).toEqual([
			[{ action: 'added', id: 'a', record: { value: 1 } }],
			[{ action: 'changed', id: 'a', record: { value: 2 } }],
		]);
		expect([...collection.entries()]).toEqual([['a', { value: 2 }]]);
	});

	it('reports a removal once and ignores ids it does not hold', () => {
		collection.set('a', { value: 1 });

		collection.remove('a');
		collection.remove('a');
		collection.remove('never-set');

		expect(changes.mock.calls.filter(([change]) => change.action === 'removed')).toEqual([[{ action: 'removed', id: 'a' }]]);
		expect([...collection.entries()]).toEqual([]);
	});

	it('stops notifying a handler once it unsubscribes', () => {
		const off = collection.onChange(jest.fn());
		const late = jest.fn();
		const offLate = collection.onChange(late);

		off();
		collection.set('a', { value: 1 });
		offLate();
		collection.set('b', { value: 2 });

		expect(late).toHaveBeenCalledTimes(1);
		expect(changes).toHaveBeenCalledTimes(2);
	});
});
