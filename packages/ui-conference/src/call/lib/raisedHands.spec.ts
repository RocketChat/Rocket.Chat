import { handPositionsOf, nameRaisedHands } from './raisedHands';

const hands = [
	{ id: 'ada', raisedAt: 1 },
	{ id: 'bob', raisedAt: 2 },
	{ id: 'ghost', raisedAt: 3 },
];

describe('handPositionsOf', () => {
	it('numbers the queue from one, in the order it is given', () => {
		expect(handPositionsOf(hands)).toEqual({ ada: 1, bob: 2, ghost: 3 });
	});
});

describe('nameRaisedHands', () => {
	it('names each hand from the membership, by name, then username, then the fallback', () => {
		expect(
			nameRaisedHands(
				hands,
				[
					{ _id: 'ada', name: 'Ada Lovelace', username: 'ada' },
					{ _id: 'bob', username: 'bob' },
				],
				'User',
				'reader',
			),
		).toEqual([
			{ id: 'ada', name: 'Ada Lovelace' },
			{ id: 'bob', name: 'bob' },
			{ id: 'ghost', name: 'User' },
		]);
	});

	it("marks the reader's own hand", () => {
		expect(nameRaisedHands(hands, [{ _id: 'bob', name: 'Bob', username: 'bob' }], 'User', 'bob')).toEqual([
			{ id: 'ada', name: 'User' },
			{ id: 'bob', name: 'Bob', isLocal: true },
			{ id: 'ghost', name: 'User' },
		]);
	});
});
