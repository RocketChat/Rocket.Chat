import { Updater } from './Updater';

type DocType = {
	_id: string;
	name: string;
	age: number;
	scores: number[];
	address: {
		city: string;
		zip: string;
	};
	lastModified?: Date;
};

const baseDoc: DocType = {
	_id: 'test123',
	name: 'John',
	age: 30,
	scores: [10, 20, 30],
	address: { city: 'New York', zip: '10001' },
};

describe('constructor', () => {
	it('should create an instance with a modifier', () => {
		const updater = new Updater<DocType>({ $set: { name: 'Jane' } });
		expect(updater).toBeInstanceOf(Updater);
	});
});

describe('modify', () => {
	it('should throw an error if modifier is not a plain object', () => {
		// @ts-expect-error - Testing invalid input
		const updater = new Updater<DocType>('not an object');
		expect(() => updater.modify(baseDoc)).toThrow('Modifier must be an object');
	});

	describe('replace mode', () => {
		it('should replace document fields with new values', () => {
			const updater = new Updater<DocType>({ name: 'Jane', age: 25 });
			const result = updater.modify(baseDoc);
			expect(result).toEqual({
				_id: 'test123', // _id is preserved
				name: 'Jane',
				age: 25,
			});
		});

		it('should preserve _id when replacing fields', () => {
			const updater = new Updater<DocType>({ name: 'Jane' });
			const result = updater.modify(baseDoc);
			expect(result._id).toBe('test123');
		});

		it('should throw an error when trying to change _id', () => {
			const updater = new Updater<DocType>({ _id: 'different123', name: 'Jane' });
			expect(() => updater.modify(baseDoc)).toThrow('The _id field cannot be changed');
		});
	});

	describe('update modifiers', () => {
		describe('$set', () => {
			it('should set a value for a top-level field', () => {
				const updater = new Updater<DocType>({ $set: { name: 'Jane' } });
				const result = updater.modify(baseDoc);
				expect(result.name).toBe('Jane');
			});

			it('should set a value for a nested field', () => {
				const updater = new Updater<DocType>({ $set: { 'address.city': 'Boston' } });
				const result = updater.modify(baseDoc);
				expect(result.address.city).toBe('Boston');
			});

			it('should set a value for an array element', () => {
				const updater = new Updater<DocType>({ $set: { 'scores.1': 25 } });
				const result = updater.modify(baseDoc);
				expect(result.scores[1]).toBe(25);
			});

			it('should create fields that do not exist', () => {
				const updater = new Updater<DocType & { address?: { state?: string } }>({ $set: { 'address.state': 'NY' } });
				const result = updater.modify(baseDoc);
				expect(result.address.state).toBe('NY');
			});

			it('should throw an error when setting a property on null', () => {
				type DocType = { _id: string; nullField: null };
				const doc: DocType = { _id: 'test123', nullField: null };
				const updater = new Updater<DocType>({ $set: { 'nullField.prop': 'value' } });
				expect(() => updater.modify(doc)).toThrow("Cannot use the part 'prop' to traverse null");
			});

			it('should throw an error when setting a property on non-object field', () => {
				const updater = new Updater<DocType>({ $set: { 'name.first': 'Jane' } });
				expect(() => updater.modify(baseDoc)).toThrow("Cannot use the part 'first' to traverse John");
			});
		});

		describe('$inc', () => {
			it('should increment a numeric field', () => {
				const updater = new Updater<DocType>({ $inc: { age: 5 } });
				const result = updater.modify(baseDoc);
				expect(result.age).toBe(35);
			});

			it('should create and set a field if it does not exist', () => {
				const updater = new Updater<DocType & { count?: number }>({ $inc: { count: 1 } });
				const result = updater.modify(baseDoc);
				expect(result.count).toBe(1);
			});

			it('should throw an error when incrementing a non-numeric field', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $inc: { name: 5 } });
				expect(() => updater.modify(baseDoc)).toThrow('Cannot apply $inc modifier to non-number');
			});

			it('should throw an error when arg is not a number', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $inc: { age: 'five' } });
				expect(() => updater.modify(baseDoc)).toThrow('Modifier $inc allowed for numbers only');
			});
		});

		describe('$min', () => {
			it('should set value to minimum of current and new value', () => {
				const updater = new Updater<DocType>({ $min: { age: 25 } });
				const result = updater.modify(baseDoc);
				expect(result.age).toBe(25);
			});

			it('should leave value unchanged if current value is less than new value', () => {
				const updater = new Updater<DocType>({ $min: { age: 35 } });
				const result = updater.modify(baseDoc);
				expect(result.age).toBe(30);
			});

			it('should create field with provided value if it does not exist', () => {
				const updater = new Updater<DocType & { minAge?: number }>({ $min: { minAge: 18 } });
				const result = updater.modify(baseDoc);
				expect(result.minAge).toBe(18);
			});

			it('should throw an error when arg is not a number', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $min: { age: 'twenty' } });
				expect(() => updater.modify(baseDoc)).toThrow('Modifier $min allowed for numbers only');
			});

			it('should throw an error when applying to a non-number field', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $min: { name: 20 } });
				expect(() => updater.modify(baseDoc)).toThrow('Cannot apply $min modifier to non-number');
			});
		});

		describe('$max', () => {
			it('should set value to maximum of current and new value', () => {
				const updater = new Updater<DocType>({ $max: { age: 35 } });
				const result = updater.modify(baseDoc);
				expect(result.age).toBe(35);
			});

			it('should leave value unchanged if current value is greater than new value', () => {
				const updater = new Updater<DocType>({ $max: { age: 25 } });
				const result = updater.modify(baseDoc);
				expect(result.age).toBe(30);
			});

			it('should create field with provided value if it does not exist', () => {
				const updater = new Updater<DocType & { maxAge?: number }>({ $max: { maxAge: 50 } });
				const result = updater.modify(baseDoc);
				expect(result.maxAge).toBe(50);
			});

			it('should throw an error when arg is not a number', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $max: { age: 'thirty' } });
				expect(() => updater.modify(baseDoc)).toThrow('Modifier $max allowed for numbers only');
			});

			it('should throw an error when applying to a non-number field', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $max: { name: 40 } });
				expect(() => updater.modify(baseDoc)).toThrow('Cannot apply $max modifier to non-number');
			});
		});

		describe('$mul', () => {
			it('should multiply a numeric field', () => {
				const updater = new Updater<DocType>({ $mul: { age: 2 } });
				const result = updater.modify(baseDoc);
				expect(result.age).toBe(60);
			});

			it('should set field to 0 if it does not exist', () => {
				const updater = new Updater<DocType & { factor?: number }>({ $mul: { factor: 5 } });
				const result = updater.modify(baseDoc);
				expect(result.factor).toBe(0);
			});

			it('should throw an error when arg is not a number', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $mul: { age: 'two' } });
				expect(() => updater.modify(baseDoc)).toThrow('Modifier $mul allowed for numbers only');
			});

			it('should throw an error when multiplying a non-numeric field', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $mul: { name: 2 } });
				expect(() => updater.modify(baseDoc)).toThrow('Cannot apply $mul modifier to non-number');
			});
		});

		describe('$rename', () => {
			it('should rename a field', () => {
				const updater = new Updater<DocType & { fullName?: string }>({ $rename: { name: 'fullName' } });
				const result = updater.modify(baseDoc);
				expect(result.name).toBeUndefined();
				expect(result.fullName).toBe('John');
			});

			it('should rename a nested field', () => {
				const updater = new Updater<DocType & { address?: { town?: string } }>({ $rename: { 'address.city': 'address.town' } });
				const result = updater.modify(baseDoc);
				expect(result.address.city).toBeUndefined();
				expect(result.address.town).toBe('New York');
			});

			it('should ignore if source field does not exist', () => {
				const updater = new Updater<DocType>({ $rename: { nonExistent: 'newField' } });
				const result = updater.modify(baseDoc);
				expect(result).toEqual(baseDoc);
			});

			it('should throw an error when source and target are the same', () => {
				const updater = new Updater<DocType>({ $rename: { name: 'name' } });
				expect(() => updater.modify(baseDoc)).toThrow('$rename source must differ from target');
			});

			it('should throw an error when target is not a string', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $rename: { name: 123 } });
				expect(() => updater.modify(baseDoc)).toThrow('$rename target must be a string');
			});

			it('should throw an error when target contains null byte', () => {
				const updater = new Updater<DocType>({ $rename: { name: 'new\0name' } });
				expect(() => updater.modify(baseDoc)).toThrow('cannot contain an embedded null byte');
			});
		});

		describe('$unset', () => {
			it('should remove a field', () => {
				const updater = new Updater<DocType>({ $unset: { name: 1 } });
				const result = updater.modify(baseDoc);
				expect(result.name).toBeUndefined();
			});

			it('should remove a nested field', () => {
				const updater = new Updater<DocType>({ $unset: { 'address.city': 1 } });
				const result = updater.modify(baseDoc);
				expect(result.address.city).toBeUndefined();
			});

			it('should set array element to null instead of removing it', () => {
				const updater = new Updater<DocType>({ $unset: { 'scores.1': 1 } });
				const result = updater.modify(baseDoc);
				expect(result.scores[1]).toBeNull();
			});

			it('should ignore if field does not exist', () => {
				const updater = new Updater<DocType>({ $unset: { nonExistent: 1 } });
				const result = updater.modify(baseDoc);
				expect(result).toEqual(baseDoc);
			});

			it('should ignore if target is undefined', () => {
				type DocType = { _id: string; nested?: { prop?: string } };
				const doc = { _id: 'test', nested: { prop: 'value' } };
				const updater = new Updater<DocType>({ $unset: { 'nested.nonexistent': 1 } });
				const result = updater.modify(doc);
				expect(result).toEqual(doc);
			});
		});

		describe('$currentDate', () => {
			it('should set field to current date with { $type: "date" }', () => {
				const now = new Date();
				jest.useFakeTimers().setSystemTime(now);

				const updater = new Updater<DocType>({ $currentDate: { lastModified: { $type: 'date' } } });
				const result = updater.modify(baseDoc);

				expect(result.lastModified).toBeInstanceOf(Date);
				expect(result.lastModified?.getTime()).toBe(now.getTime());

				jest.useRealTimers();
			});

			it('should set field to current date with true', () => {
				const now = new Date();
				jest.useFakeTimers().setSystemTime(now);

				const updater = new Updater<DocType>({ $currentDate: { lastModified: true } });
				const result = updater.modify(baseDoc);

				expect(result.lastModified).toBeInstanceOf(Date);
				expect(result.lastModified?.getTime()).toBe(now.getTime());

				jest.useRealTimers();
			});

			it('should throw an error when $type is not "date"', () => {
				const updater = new Updater<DocType>({ $currentDate: { lastModified: { $type: 'timestamp' } } });
				expect(() => updater.modify(baseDoc)).toThrow('only support the date type');
			});

			it('should throw an error when value is not true or object with $type', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $currentDate: { lastModified: 'now' } });
				expect(() => updater.modify(baseDoc)).toThrow('Invalid $currentDate modifier');
			});
		});

		describe('$push', () => {
			it('should append an element to an array', () => {
				const updater = new Updater<DocType>({ $push: { scores: 40 } });
				const result = updater.modify(baseDoc);
				expect(result.scores).toEqual([10, 20, 30, 40]);
			});

			it('should create an array if field does not exist', () => {
				const updater = new Updater<DocType & { tags?: string[] }>({ $push: { tags: 'new' } });
				const result = updater.modify(baseDoc);
				expect(result.tags).toEqual(['new']);
			});

			it('should throw an error when pushing to a non-array', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $push: { name: 'suffix' } });
				expect(() => updater.modify(baseDoc)).toThrow('Cannot apply $push modifier to non-array');
			});

			it('should append multiple elements with $each', () => {
				const updater = new Updater<DocType>({ $push: { scores: { $each: [40, 50] } } });
				const result = updater.modify(baseDoc);
				expect(result.scores).toEqual([10, 20, 30, 40, 50]);
			});

			it('should insert elements at position with $position', () => {
				const updater = new Updater<DocType>({ $push: { scores: { $each: [15, 25], $position: 1 } } });
				const result = updater.modify(baseDoc);
				expect(result.scores).toEqual([10, 15, 25, 20, 30]);
			});

			it('should limit array size with $slice', () => {
				const updater = new Updater<DocType>({ $push: { scores: { $each: [40], $slice: 2 } } });
				const result = updater.modify(baseDoc);
				expect(result.scores).toEqual([10, 20]);
			});

			it('should slice from end with negative $slice', () => {
				const updater = new Updater<DocType>({ $push: { scores: { $each: [40, 50], $slice: -3 } } });
				const result = updater.modify(baseDoc);
				expect(result.scores).toEqual([30, 40, 50]);
			});

			it('should sort elements when $sort is provided', () => {
				type DocType = {
					_id: string;
					items: { name: string; value: number }[];
				};
				const doc = {
					_id: 'test123',
					items: [
						{ name: 'B', value: 20 },
						{ name: 'A', value: 30 },
						{ name: 'C', value: 10 },
					],
				};
				const updater = new Updater<DocType>({
					$push: {
						items: {
							$each: [{ name: 'D', value: 5 }],
							$sort: { value: 1 },
							$slice: 4,
						},
					},
				});
				const result = updater.modify(doc);
				expect(result.items.map((i) => i.value)).toEqual([5, 10, 20, 30]);
			});

			it('should throw error when $sort is used without $slice', () => {
				type DocType = {
					_id: string;
					items: { name: string }[];
				};
				const updater = new Updater<DocType>({
					$push: {
						items: {
							$each: [{ name: 'D' }],
							$sort: { name: 1 },
						},
					},
				});
				expect(() => updater.modify({ _id: 'test123', items: [{ name: 'A' }] })).toThrow('$sort requires $slice to be present');
			});

			it('should throw error when $position is negative', () => {
				const updater = new Updater<DocType>({ $push: { scores: { $each: [40], $position: -1 } } });
				expect(() => updater.modify(baseDoc)).toThrow('$position in $push must be zero or positive');
			});

			it('should throw error when $each is not an array', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $push: { scores: { $each: 40 } } });
				expect(() => updater.modify(baseDoc)).toThrow('$each must be an array');
			});

			it('should throw error when elements are not objects when using $sort', () => {
				const updater = new Updater<DocType>({
					$push: {
						scores: {
							$each: [40],
							$sort: { $: 1 },
							$slice: 3,
						},
					},
				});
				expect(() => updater.modify(baseDoc)).toThrow('require all elements to be objects');
			});

			it('should throw error when $position is not a number', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $push: { scores: { $each: [40], $position: 'first' } } });
				expect(() => updater.modify(baseDoc)).toThrow('$position must be a numeric value');
			});

			it('should throw error when $slice is not a number', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $push: { scores: { $each: [40], $slice: 'two' } } });
				expect(() => updater.modify(baseDoc)).toThrow('$slice must be a numeric value');
			});

			it('should empty the array when $slice is 0', () => {
				const updater = new Updater<DocType>({ $push: { scores: { $each: [40], $slice: 0 } } });
				const result = updater.modify(baseDoc);
				expect(result.scores).toEqual([]);
			});
		});

		describe('$addToSet', () => {
			it('should add an element to an array if not present', () => {
				const updater = new Updater<DocType>({ $addToSet: { scores: 40 } });
				const result = updater.modify(baseDoc);
				expect(result.scores).toEqual([10, 20, 30, 40]);
			});

			it('should not add duplicates', () => {
				const updater = new Updater<DocType>({ $addToSet: { scores: 20 } });
				const result = updater.modify(baseDoc);
				expect(result.scores).toEqual([10, 20, 30]);
			});

			it('should create an array if field does not exist', () => {
				const updater = new Updater<DocType & { tags?: string[] }>({ $addToSet: { tags: 'new' } });
				const result = updater.modify(baseDoc);
				expect(result.tags).toEqual(['new']);
			});

			it('should add multiple unique elements with $each', () => {
				const updater = new Updater<DocType>({ $addToSet: { scores: { $each: [30, 40, 50] } } });
				const result = updater.modify(baseDoc);
				expect(result.scores).toEqual([10, 20, 30, 40, 50]);
			});

			it('should throw an error when adding to a non-array', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $addToSet: { name: 'suffix' } });
				expect(() => updater.modify(baseDoc)).toThrow('Cannot apply $addToSet modifier to non-array');
			});

			it('should add objects that are deeply equal but not the same reference', () => {
				type DocType = { _id: string; items: { id: number; value: string }[] };
				const doc = { _id: 'test', items: [{ id: 1, value: 'a' }] };
				const updater = new Updater<DocType>({ $addToSet: { items: { id: 2, value: 'b' } } });
				const result = updater.modify(doc);
				expect(result.items).toEqual([
					{ id: 1, value: 'a' },
					{ id: 2, value: 'b' },
				]);
			});

			it('should not add objects that are deeply equal', () => {
				type DocType = { _id: string; items: { id: number; value: string }[] };
				const doc = { _id: 'test', items: [{ id: 1, value: 'a' }] };
				const updater = new Updater<DocType>({ $addToSet: { items: { id: 1, value: 'a' } } });
				const result = updater.modify(doc);
				expect(result.items).toEqual([{ id: 1, value: 'a' }]);
			});
		});

		describe('$pop', () => {
			it('should remove the last element when arg is positive', () => {
				const updater = new Updater<DocType>({ $pop: { scores: 1 } });
				const result = updater.modify(baseDoc);
				expect(result.scores).toEqual([10, 20]);
			});

			it('should remove the first element when arg is negative', () => {
				const updater = new Updater<DocType>({ $pop: { scores: -1 } });
				const result = updater.modify(baseDoc);
				expect(result.scores).toEqual([20, 30]);
			});

			it('should ignore if field does not exist', () => {
				const updater = new Updater<DocType>({ $pop: { nonExistent: 1 } });
				const result = updater.modify(baseDoc);
				expect(result).toEqual(baseDoc);
			});

			it('should throw an error when popping a non-array', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $pop: { name: 1 } });
				expect(() => updater.modify(baseDoc)).toThrow('Cannot apply $pop modifier to non-array');
			});
		});

		describe('$pull', () => {
			it('should remove elements matching a value', () => {
				const updater = new Updater<DocType>({ $pull: { scores: 20 } });
				const result = updater.modify(baseDoc);
				expect(result.scores).toEqual([10, 30]);
			});

			it('should remove elements matching a query', () => {
				type DocType = { _id: string; items: { id: number; score: number }[] };
				const doc = {
					_id: 'test123',
					items: [
						{ id: 1, score: 10 },
						{ id: 2, score: 20 },
						{ id: 3, score: 30 },
					],
				};
				const updater = new Updater<DocType>({ $pull: { items: { score: { $gt: 15 } } } });
				const result = updater.modify(doc);
				expect(result.items).toEqual([{ id: 1, score: 10 }]);
			});

			it('should ignore if field does not exist', () => {
				const updater = new Updater<DocType>({ $pull: { nonExistent: 1 } });
				const result = updater.modify(baseDoc);
				expect(result).toEqual(baseDoc);
			});

			it('should throw an error when pulling from a non-array', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $pull: { name: 'J' } });
				expect(() => updater.modify(baseDoc)).toThrow('Cannot apply $pull/pullAll modifier to non-array');
			});

			it('should pull items based on complex queries', () => {
				type DocType = { _id: string; items: { type: string; value: number; active: boolean }[] };
				const doc = {
					_id: 'test123',
					items: [
						{ type: 'A', value: 10, active: true },
						{ type: 'B', value: 20, active: false },
						{ type: 'A', value: 30, active: true },
					],
				};

				const updater = new Updater<DocType>({
					$pull: {
						items: {
							type: 'A',
							value: { $gt: 15 },
						},
					},
				});

				const result = updater.modify(doc);
				expect(result.items).toEqual([
					{ type: 'A', value: 10, active: true },
					{ type: 'B', value: 20, active: false },
				]);
			});
		});

		describe('$pullAll', () => {
			it('should remove all elements in the given array', () => {
				const updater = new Updater<DocType>({ $pullAll: { scores: [10, 30] } });
				const result = updater.modify(baseDoc);
				expect(result.scores).toEqual([20]);
			});

			it('should ignore if field does not exist', () => {
				const updater = new Updater<DocType>({ $pullAll: { nonExistent: [1] } });
				const result = updater.modify(baseDoc);
				expect(result).toEqual(baseDoc);
			});

			it('should throw an error when arg is not an array', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $pullAll: { scores: 10 } });
				expect(() => updater.modify(baseDoc)).toThrow('Modifier $pushAll/pullAll allowed for arrays only');
			});

			it('should throw an error when pulling from a non-array', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $pullAll: { name: ['J'] } });
				expect(() => updater.modify(baseDoc)).toThrow('Cannot apply $pull/pullAll modifier to non-array');
			});

			it('should remove complex objects that match exactly', () => {
				type DocType = { _id: string; items: { id: number; value: string }[] };
				const doc = {
					_id: 'test123',
					items: [
						{ id: 1, value: 'a' },
						{ id: 2, value: 'b' },
						{ id: 3, value: 'c' },
					],
				};

				const updater = new Updater<DocType>({
					$pullAll: {
						items: [
							{ id: 1, value: 'a' },
							{ id: 3, value: 'c' },
						],
					},
				});

				const result = updater.modify(doc);
				expect(result.items).toEqual([{ id: 2, value: 'b' }]);
			});
		});

		describe('$bit', () => {
			it('should throw not supported error', () => {
				const updater = new Updater<DocType>({ $bit: { flag: { and: 1 } } });
				expect(() => updater.modify(baseDoc)).toThrow('$bit is not supported');
			});
		});

		describe('$setOnInsert', () => {
			it('should throw an error when used directly', () => {
				const updater = new Updater<DocType>({ $setOnInsert: { createdAt: new Date() } });
				expect(() => updater.modify(baseDoc)).toThrow('It should have been converted to $set in _modify');
			});

			it('should be treated as $set when isInsert is true', () => {
				const now = new Date();
				const updater = new Updater<{ _id: string; createdAt?: Date }>({ $setOnInsert: { createdAt: now } });
				const result = updater.modify({ _id: '123' }, { isInsert: true });
				expect(result.createdAt).toEqual(now);
			});
		});

		describe('invalid modifiers', () => {
			it('should throw an error for invalid modifier', () => {
				// @ts-expect-error - Testing invalid input
				const updater = new Updater<DocType>({ $invalid: { name: 'test' } });
				expect(() => updater.modify(baseDoc)).toThrow('Invalid modifier specified $invalid');
			});

			it('should throw an error when mixing modifiers with non-modifiers', () => {
				const updater = new Updater<DocType>({ $set: { name: 'Jane' }, age: 25 });
				expect(() => updater.modify(baseDoc)).toThrow('Update parameter cannot have both modifier and non-modifier fields.');
			});
		});

		describe('path handling', () => {
			it('should throw an error for empty update path', () => {
				const updater = new Updater<DocType>({ $set: { '': 'value' } });
				expect(() => updater.modify(baseDoc)).toThrow('An empty update path is not valid.');
			});

			it('should throw an error for path with empty field name', () => {
				const updater = new Updater<DocType>({ $set: { 'name..prop': 'value' } });
				expect(() => updater.modify(baseDoc)).toThrow("The update path 'name..prop' contains an empty field name");
			});

			it('should handle numeric keys in arrays', () => {
				const updater = new Updater<DocType>({ $set: { 'scores.0': 15 } });
				const result = updater.modify(baseDoc);
				expect(result.scores[0]).toBe(15);
			});

			it('should extend arrays as needed', () => {
				const updater = new Updater<DocType>({ $set: { 'scores.5': 60 } });
				const result = updater.modify(baseDoc);
				expect(result.scores).toEqual([10, 20, 30, null, null, 60]);
			});

			it('should throw if trying to modify a non-object property', () => {
				const updater = new Updater<DocType>({ $set: { 'age.years': 30 } });
				expect(() => updater.modify(baseDoc)).toThrow("Cannot use the part 'years' to traverse 30");
			});

			it('should throw if update path ends with empty field name', () => {
				const updater = new Updater<DocType>({ $set: { 'address.': 'value' } });
				expect(() => updater.modify(baseDoc)).toThrow("The update path 'address.' contains an empty field name, which is not allowed.");
			});

			it('should throw an error when path contains an invalid field name', () => {
				const updater = new Updater<DocType>({ $set: { 'items.$invalid': 'value' } });
				expect(() => updater.modify(baseDoc)).toThrow();
			});
		});

		describe('arrayIndices', () => {
			it('should handle positional operator with arrayIndices', () => {
				type DocType = {
					_id: string;
					items: { id: number; values: number[] }[];
				};
				const doc = {
					_id: 'test123',
					items: [
						{ id: 1, values: [10, 20] },
						{ id: 2, values: [30, 40] },
					],
				};

				const updater = new Updater<DocType>({ $set: { 'items.$.values.$': 25 } });
				const result = updater.modify(doc, { arrayIndices: [1, 0] });

				expect(result.items[1].values[0]).toBe(25);
			});

			it('should throw an error when using positional operator without arrayIndices', () => {
				const updater = new Updater<DocType>({ $set: { 'items.$': 25 } });
				expect(() => updater.modify(baseDoc)).toThrow('The positional operator did not find the match needed');
			});

			it('should throw an error when using multiple positional operators', () => {
				const updater = new Updater<DocType>({ $set: { 'items.$.values.$.name': 25 } });
				expect(() => updater.modify(baseDoc, { arrayIndices: [0] })).toThrow('Too many positional');
			});

			it('should handle multiple positional operators with sufficient arrayIndices', () => {
				type DocType = {
					_id: string;
					items: { id: number; subitems: { id: string; values: number[] }[] }[];
				};
				const doc = {
					_id: 'test123',
					items: [
						{
							id: 1,
							subitems: [
								{ id: 'a', values: [1, 2, 3] },
								{ id: 'b', values: [4, 5, 6] },
							],
						},
						{
							id: 2,
							subitems: [
								{ id: 'c', values: [7, 8, 9] },
								{ id: 'd', values: [10, 11, 12] },
							],
						},
					],
				};

				const updater = new Updater<DocType>({ $set: { 'items.$.subitems.$.values.$': 99 } });
				const result = updater.modify(doc, { arrayIndices: [1, 0, 1] });

				expect(result.items[1].subitems[0].values[1]).toBe(99);
			});
		});

		it('should maintain immutability of the _id field', () => {
			const updater = new Updater<DocType>({ $set: { _id: 'test123' } }); // Same ID
			const result = updater.modify(baseDoc);
			expect(result._id).toBe('test123');

			const updater2 = new Updater<DocType>({ $set: { _id: 'changed123' } });
			expect(() => updater2.modify(baseDoc)).toThrow("the (immutable) field '_id' was found to have been altered");
		});
	});
});

describe('createUpsertDocument', () => {
	it('should create a document from the selector and modifier', () => {
		type DocType = { _id: string; name?: string; status?: string; category?: string; createdAt?: Date };
		const selector = { _id: 'new123', category: 'test' };
		const updater = new Updater<DocType>({ $set: { name: 'New Item', status: 'active' } });

		const result = updater.createUpsertDocument(selector);

		expect(result).toEqual({
			_id: 'new123',
			category: 'test',
			name: 'New Item',
			status: 'active',
		});
	});

	it('should handle replacement style updates', () => {
		type DocType = { _id: string; name?: string; status?: string };
		const selector = { _id: 'new123' };
		const updater = new Updater<DocType>({ name: 'New Item', status: 'active' });

		const result = updater.createUpsertDocument(selector);

		expect(result).toEqual({
			_id: 'new123',
			name: 'New Item',
			status: 'active',
		});
	});

	it('should apply $setOnInsert modifiers', () => {
		const selector = { category: 'test' };
		const updater = new Updater<DocType>({
			$set: { name: 'New Item' },
			$setOnInsert: { createdAt: new Date('2023-01-01') },
		});

		const result = updater.createUpsertDocument(selector);

		expect(result).toEqual({
			category: 'test',
			name: 'New Item',
			createdAt: new Date('2023-01-01'),
		});
	});

	it('should use the _id from the selector', () => {
		const selector = { _id: 'specific123', category: 'test' };
		const updater = new Updater<DocType>({ $set: { name: 'Named Item' } });

		const result = updater.createUpsertDocument(selector);

		expect(result._id).toBe('specific123');
	});

	it('should handle complex update operators during upsert', () => {
		const selector = { _id: 'complex123', category: 'test' };
		const updater = new Updater<DocType>({
			$set: { name: 'Complex Item' },
			$inc: { 'count': 1, 'stats.visits': 1 } as any,
			$push: { tags: 'new' } as any,
			$setOnInsert: { createdAt: new Date('2023-01-01') } as any,
		});

		const result = updater.createUpsertDocument(selector);

		expect(result).toEqual({
			_id: 'complex123',
			category: 'test',
			name: 'Complex Item',
			count: 1,
			stats: { visits: 1 },
			tags: ['new'],
			createdAt: new Date('2023-01-01'),
		});
	});
});

describe('findModTarget', () => {
	// We'll test this indirectly through the modify method since it's private
	it('should handle complex nested paths', () => {
		type DocType = {
			_id: string;
			nested: {
				array: Array<{ name: string; tags: string[] }>;
			};
		};
		const doc = {
			_id: 'test123',
			nested: {
				array: [
					{ name: 'item1', tags: ['a', 'b'] },
					{ name: 'item2', tags: ['c', 'd'] },
				],
			},
		};

		const updater = new Updater<DocType>({ $set: { 'nested.array.1.tags.0': 'updated' } });
		const result = updater.modify(doc);

		expect(result.nested.array[1].tags[0]).toBe('updated');
	});

	it('should handle the noCreate option for operators that do not create fields', () => {
		// Testing with $pop which should have noCreate=true
		type DocType = { _id: string; items?: number[] };
		const doc = { _id: 'test123' };
		const updater = new Updater<DocType>({ $pop: { 'items.0': 1 } });
		const result = updater.modify(doc);

		// Since items doesn't exist and $pop has noCreate=true, nothing should happen
		expect(result).toEqual({ _id: 'test123' });
	});

	it('should throw an error when trying to append to array using string field name', () => {
		type DocType = { _id: string; scores: number[] };
		const doc = { _id: 'test123', scores: [10, 20, 30] };
		const updater = new Updater<DocType>({ $set: { 'scores.field': 40 } });

		expect(() => updater.modify(doc)).toThrow("can't append to array using string field name");
	});

	it('should throw an error when modifying field of list value', () => {
		type DocType = { _id: string; items: (number | { nested: string })[] };
		const doc = { _id: 'test123', items: [10, 20, { nested: 'value' }] };
		const updater = new Updater<DocType>({ $set: { 'items.0.field': 'value' } });

		expect(() => updater.modify(doc)).toThrow("can't modify field 'field' of list value");
	});

	it('should handle multiple nested arrays correctly', () => {
		type DocType = {
			_id: string;
			matrix: number[][];
		};
		const doc = {
			_id: 'test123',
			matrix: [
				[1, 2, 3],
				[4, 5, 6],
				[7, 8, 9],
			],
		};

		const updater = new Updater<DocType>({ $set: { 'matrix.1.1': 50 } });
		const result = updater.modify(doc);

		expect(result.matrix[1][1]).toBe(50);
	});
});

describe('complex scenarios', () => {
	it('should handle multiple operators in a single update', () => {
		type DocType = {
			_id: string;
			name: string;
			count: number;
			tags: string[];
			stats: {
				views: number;
				likes: number;
			};
			lastModified?: Date;
		};

		const doc: DocType = {
			_id: 'multi',
			name: 'Original',
			count: 10,
			tags: ['a', 'b'],
			stats: { views: 100, likes: 5 },
		};

		const updater = new Updater<DocType>({
			$set: { name: 'Updated' },
			$inc: { 'count': 5, 'stats.views': 50 } as any,
			$push: { tags: 'c' } as any,
			$currentDate: { lastModified: true } as any,
		});

		const result = updater.modify(doc);

		expect(result.name).toBe('Updated');
		expect(result.count).toBe(15);
		expect(result.tags).toEqual(['a', 'b', 'c']);
		expect(result.stats.views).toBe(150);
		expect(result.lastModified).toBeInstanceOf(Date);
	});

	it('should handle array updates with multiple array indices', () => {
		type DocType = {
			_id: string;
			matrix: Array<Array<{ value: number }>>;
		};

		const doc: DocType = {
			_id: 'nested',
			matrix: [
				[{ value: 1 }, { value: 2 }],
				[{ value: 3 }, { value: 4 }],
			],
		};

		const updater = new Updater<DocType>({ $set: { 'matrix.1.0.value': 30 } });
		const result = updater.modify(doc);

		expect(result.matrix[1][0].value).toBe(30);
	});

	it('should handle deep array creation when fields do not exist', () => {
		type DocType = {
			_id: string;
			items?: Array<{ nested: Array<{ value: number }> }>;
		};

		const doc: DocType = { _id: 'create' };

		const updater = new Updater<DocType>({ $set: { 'items.0.nested.0.value': 42 } });
		const result = updater.modify(doc);

		expect(result.items?.[0].nested[0].value).toBe(42);
		// Check that the arrays are properly filled with nulls
		expect(result.items).toEqual([{ nested: [{ value: 42 }] }]);
	});

	it('should handle a mix of array and object paths', () => {
		type DocType = {
			_id: string;
			users: Array<{
				id: number;
				profile: {
					settings: {
						notifications: boolean;
						theme: string;
					};
					preferences: Array<{
						key: string;
						value: any;
					}>;
				};
			}>;
		};

		const doc: DocType = {
			_id: 'complex',
			users: [
				{
					id: 1,
					profile: {
						settings: {
							notifications: true,
							theme: 'light',
						},
						preferences: [{ key: 'language', value: 'en' }],
					},
				},
			],
		};

		const updater = new Updater<DocType>({
			$set: {
				'users.0.profile.settings.theme': 'dark',
				'users.0.profile.preferences.0.value': 'fr',
			},
		});

		const result = updater.modify(doc);

		expect(result.users[0].profile.settings.theme).toBe('dark');
		expect(result.users[0].profile.preferences[0].value).toBe('fr');
	});

	it('should handle all update operators together', () => {
		type DocType = {
			_id: string;
			title: string;
			count: number;
			values: number[];
			tags: string[];
			nested: {
				value: number;
				oldName: string;
				newName?: string;
			};
			metadata: {
				created: Date;
				views: number;
				updated?: Date;
			};
		};

		const now = new Date();
		jest.useFakeTimers().setSystemTime(now);

		const doc: DocType = {
			_id: 'all-ops',
			title: 'Original',
			count: 10,
			values: [1, 2, 3, 4, 5],
			tags: ['old', 'test'],
			nested: {
				value: 100,
				oldName: 'something',
			},
			metadata: {
				created: new Date('2023-01-01'),
				views: 50,
			},
		};

		const updater = new Updater<DocType>({
			$set: { title: 'Updated' },
			$inc: { 'count': 5, 'metadata.views': 10 },
			$push: { values: { $each: [6, 7], $slice: 5 } },
			$addToSet: { tags: { $each: ['new', 'test'] } },
			$pop: { values: 1 },
			$pull: { tags: 'old' },
			$rename: { 'nested.oldName': 'nested.newName' },
			$currentDate: { 'metadata.updated': true },
			$unset: { 'metadata.created': 1 },
		});

		const result = updater.modify(doc);

		expect(result.title).toBe('Updated');
		expect(result.count).toBe(15);
		expect(result.values).toEqual([1, 2, 3, 4]); // Sorted and sliced, then popped
		expect(result.tags).toEqual(['test', 'new']); // 'old' removed, 'new' added, 'test' not duplicated
		expect(result.nested.oldName).toBeUndefined();
		expect(result.nested.newName).toBe('something');
		expect(result.metadata.created).toBeUndefined();
		expect(result.metadata.views).toBe(60);
		expect(result.metadata.updated).toBeInstanceOf(Date);
		expect(result.metadata.updated?.getTime()).toBe(now.getTime());

		jest.useRealTimers();
	});
});

describe('complex array handling', () => {
	it('should handle updates to deeply nested arrays with the positional operator', () => {
		type DocType = {
			_id: string;
			items: Array<{
				id: number;
				subitems: Array<{
					name: string;
					value: number;
				}>;
			}>;
		};

		const doc: DocType = {
			_id: 'deep',
			items: [
				{
					id: 1,
					subitems: [
						{ name: 'a', value: 10 },
						{ name: 'b', value: 20 },
					],
				},
				{
					id: 2,
					subitems: [
						{ name: 'c', value: 30 },
						{ name: 'd', value: 40 },
					],
				},
			],
		};

		// Update the second subitem in the first item
		const updater = new Updater<DocType>({ $set: { 'items.$.subitems.$.value': 25 } });
		const result = updater.modify(doc, { arrayIndices: [0, 1] });

		expect(result.items[0].subitems[1].value).toBe(25);
	});

	it('should throw if trying to use a non-numeric field name with an array', () => {
		type DocType = {
			_id: string;
			items: number[];
		};

		const doc: DocType = { _id: 'array', items: [1, 2, 3] };

		const updater = new Updater<DocType>({ $set: { 'items.nonNumeric': 4 } });

		expect(() => updater.modify(doc)).toThrow();
	});

	it('should throw an error when using $rename with forbidden array operations', () => {
		type DocType = {
			_id: string;
			items: number[];
			count?: number;
		};
		const doc = {
			_id: 'test123',
			items: [1, 2, 3],
		};

		// $rename forbids arrays in the target path
		const updater = new Updater<DocType>({ $rename: { count: 'items.3' } });

		expect(() => updater.modify({ ...doc, count: 5 })).toThrow();
	});
});

describe('edge cases', () => {
	it('should handle empty arrays in push operations', () => {
		type DocType = {
			_id: string;
			items: any[];
		};

		const doc: DocType = { _id: 'empty', items: [] };

		const updater = new Updater<DocType>({
			$push: {
				items: {
					$each: [],
					$slice: 10,
				},
			},
		});

		const result = updater.modify(doc);
		expect(result.items).toEqual([]);
	});

	it('should handle very large array indices', () => {
		type DocType = {
			_id: string;
			items: any[];
		};

		const doc: DocType = { _id: 'large', items: [] };

		const updater = new Updater<DocType>({ $set: { 'items.1000': 'far away' } });
		const result = updater.modify(doc);

		expect(result.items.length).toBe(1001);
		expect(result.items[1000]).toBe('far away');
		// All intermediate values should be null
		expect(result.items[500]).toBeNull();
	});

	it('should handle deeply nested objects that need to be created', () => {
		type DocType = {
			_id: string;
			a?: {
				b?: {
					c?: {
						d?: {
							e?: {
								f?: {
									g?: string;
								};
							};
						};
					};
				};
			};
		};
		const doc = { _id: 'test123' };
		const updater = new Updater<DocType>({ $set: { 'a.b.c.d.e.f.g': 'deeply nested' } });
		const result = updater.modify(doc);

		expect(result).toEqual({
			_id: 'test123',
			a: {
				b: {
					c: {
						d: {
							e: {
								f: {
									g: 'deeply nested',
								},
							},
						},
					},
				},
			},
		});
	});

	it('should handle array indices with leading zeros', () => {
		type DocType = {
			_id: string;
			items: number[];
		};
		const doc = { _id: 'test123', items: [10, 20, 30] };
		const updater = new Updater<DocType>({ $set: { 'items.01': 25 } });
		const result = updater.modify(doc);

		expect(result.items[1]).toBe(25);
	});

	it('should handle $set null to replace an object', () => {
		type DocType = {
			_id: string;
			nested?: { prop: string } | null;
		};
		const doc = { _id: 'test123', nested: { prop: 'value' } };
		const updater = new Updater<DocType>({ $set: { nested: null } });
		const result = updater.modify(doc);

		expect(result.nested).toBeNull();
	});
});

describe('invalid field names', () => {
	it('should throw when field name contains a null byte', () => {
		type DocType = { _id: string };

		const updater = new Updater<DocType>({ $set: { 'bad\0field': 'value' } });

		expect(() => updater.modify({ _id: 'test' })).toThrow('Key bad\0field must not contain null bytes');
	});

	it('should throw when field name starts with a dollar sign', () => {
		type DocType = { _id: string };

		const updater = new Updater<DocType>({ $set: { $field: 'value' } });

		expect(() => updater.modify({ _id: 'test' })).toThrow("start with '$'");
	});

	it('should throw when field name contains a dot', () => {
		type DocType = { _id: string };

		// @ts-expect-error - Testing invalid input
		const updater = new Updater<DocType>({ 'field.with.dot': 'value' });

		expect(() => updater.modify({ _id: 'test' })).toThrow("contain '.'");
	});
});

describe('additional upsert tests', () => {
	it('should handle complex selectors in upsert', () => {
		const selector = {
			type: 'product',
			category: { $in: ['electronics', 'computers'] },
			price: { $gt: 100 },
		};

		const updater = new Updater<DocType>({ $set: { name: 'New Product', inStock: true } });
		const result = updater.createUpsertDocument(selector);

		// Only direct field=value pairs from selector are used in the new doc
		expect(result).toEqual({
			type: 'product',
			name: 'New Product',
			inStock: true,
		});
	});

	it('should use replacement object directly in upsert when not using modifiers', () => {
		type DocType = { _id: string; title: string; count: number };
		const selector = { _id: 'replace123' };
		const updater = new Updater<DocType>({ title: 'Replacement', count: 42 });

		const result = updater.createUpsertDocument(selector);

		expect(result).toEqual({
			_id: 'replace123',
			title: 'Replacement',
			count: 42,
		});
	});

	it('should handle nested fields in upsert selectors', () => {
		const selector = {
			'_id': 'nested123',
			'user.name': 'John',
			'user.profile.role': 'admin',
		};

		const updater = new Updater<DocType>({ $set: { status: 'active' } });
		const result = updater.createUpsertDocument(selector);

		expect(result).toEqual({
			_id: 'nested123',
			user: {
				name: 'John',
				profile: {
					role: 'admin',
				},
			},
			status: 'active',
		});
	});
});
