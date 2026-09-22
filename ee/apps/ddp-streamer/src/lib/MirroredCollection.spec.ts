import { MirroredCollection } from './MirroredCollection';

describe('MirroredCollection', () => {
	let mirror: MirroredCollection<{ value: number }>;
	let changes: jest.Mock;

	beforeEach(() => {
		mirror = new MirroredCollection();
		changes = jest.fn();
		mirror.onChange(changes);
	});

	it('reports the first set of an id as added and later sets as changed', () => {
		mirror.set('a', { value: 1 });
		mirror.set('a', { value: 2 });

		expect(changes.mock.calls).toEqual([
			[{ action: 'added', id: 'a', record: { value: 1 } }],
			[{ action: 'changed', id: 'a', record: { value: 2 } }],
		]);
		expect([...mirror.entries()]).toEqual([['a', { value: 2 }]]);
	});

	it('reports a removal once and ignores ids it does not hold', () => {
		mirror.set('a', { value: 1 });

		mirror.remove('a');
		mirror.remove('a');
		mirror.remove('never-set');

		expect(changes.mock.calls.filter(([change]) => change.action === 'removed')).toEqual([[{ action: 'removed', id: 'a' }]]);
		expect([...mirror.entries()]).toEqual([]);
	});

	it('stops notifying a handler once it unsubscribes', () => {
		const off = mirror.onChange(jest.fn());
		const late = jest.fn();
		const offLate = mirror.onChange(late);

		off();
		mirror.set('a', { value: 1 });
		offLate();
		mirror.set('b', { value: 2 });

		expect(late).toHaveBeenCalledTimes(1);
		expect(changes).toHaveBeenCalledTimes(2);
	});
});
