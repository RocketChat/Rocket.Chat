import { deepGet } from './deepGet';

describe('deepGet', () => {
	const object = {
		aValue: 1,
		aArray: [10, 11],
		a: {
			bValue: 2,
			bArray: [20, 21],
			b: {
				cValue: 3,
				cArray: [30, 31],
				c: {
					dValue: 4,
					dArray: [40, 41],
					d: {
						e: {
							f: {
								g: {
									deeplyNested: 'deeplyNestedValue',
								},
							},
						},
					},
				},
			},
		},
	};

	it('should return array values using a numeric key', () => {
		const list = [10, 20, 30, 40];

		expect(deepGet(list, [0])).toBe(10);
		expect(deepGet(list, [1])).toBe(20);
		expect(deepGet(list, [5])).toBe(undefined);
	});

	it('should return first level attributes using a string key', () => {
		expect(deepGet(object, 'aValue')).toBe(1);
		expect(deepGet(object, 'aArray')).toBe(object.aArray);
	});
	it('should return first level attributes using an array key', () => {
		expect(deepGet(object, ['aValue'])).toBe(1);
		expect(deepGet(object, ['aArray'])).toBe(object.aArray);
	});
	it('should return first level array values using a numeric key', () => {
		expect(deepGet(object, ['aArray', 0])).toBe(10);
		expect(deepGet(object, ['aArray', 1])).toBe(11);
	});

	it('should return second level attributes using a string key', () => {
		expect(deepGet(object, 'a.bValue')).toBe(2);
		expect(deepGet(object, 'a.bArray')).toBe(object.a.bArray);
	});
	it('should return second level attributes using an array key', () => {
		expect(deepGet(object, ['a', 'bValue'])).toBe(2);
		expect(deepGet(object, ['a', 'bArray'])).toBe(object.a.bArray);
	});
	it('should return second level array values using a numeric key', () => {
		expect(deepGet(object, ['a', 'bArray', 0])).toBe(20);
		expect(deepGet(object, ['a', 'bArray', 1])).toBe(21);
	});

	it('should return third level attributes using a string key', () => {
		expect(deepGet(object, 'a.b.cValue')).toBe(3);
		expect(deepGet(object, 'a.b.cArray')).toBe(object.a.b.cArray);
	});
	it('should return third level attributes using an array key', () => {
		expect(deepGet(object, ['a', 'b', 'cValue'])).toBe(3);
		expect(deepGet(object, ['a', 'b', 'cArray'])).toBe(object.a.b.cArray);
	});
	it('should return third level array values using a numeric key', () => {
		expect(deepGet(object, ['a', 'b', 'cArray', 0])).toBe(30);
		expect(deepGet(object, ['a', 'b', 'cArray', 1])).toBe(31);
	});

	it('should return fourth level attributes using a string key', () => {
		expect(deepGet(object, 'a.b.c.dValue')).toBe(4);
		expect(deepGet(object, 'a.b.c.dArray')).toBe(object.a.b.c.dArray);
	});
	it('should return fourth level attributes using an array key', () => {
		expect(deepGet(object, ['a', 'b', 'c', 'dValue'])).toBe(4);
		expect(deepGet(object, ['a', 'b', 'c', 'dArray'])).toBe(object.a.b.c.dArray);
	});
	it('should return fourth level array values using a numeric key', () => {
		expect(deepGet(object, ['a', 'b', 'c', 'dArray', 0])).toBe(40);
		expect(deepGet(object, ['a', 'b', 'c', 'dArray', 1])).toBe(41);
	});

	it('should return deep nested values using a string key', () => {
		expect(deepGet(object, 'a.b.c.d.e.f.g.deeplyNested')).toBe('deeplyNestedValue');
	});

	it('should return deep nested values using an array key', () => {
		expect(deepGet(object, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'deeplyNested'])).toBe('deeplyNestedValue');
	});

	it('should return undefined when trying to access an invalid attribute using a string key', () => {
		expect(deepGet(object as any, 'c')).toBeUndefined();
		expect(deepGet(object as any, 'c.c')).toBeUndefined();

		expect(deepGet(object, 'a')).toBeDefined();
		expect(deepGet(object as any, 'a.c')).toBeUndefined();
		expect(deepGet(object as any, 'a.c.c')).toBeUndefined();

		expect(deepGet(object, 'a.b')).toBeDefined();
		expect(deepGet(object as any, 'a.b.a')).toBeUndefined();
		expect(deepGet(object as any, 'a.b.a.c')).toBeUndefined();

		expect(deepGet(object, 'a.b.c')).toBeDefined();
		// After the third level there's no more type validation
		expect(deepGet(object, 'a.b.c.a')).toBeUndefined();
		expect(deepGet(object, 'a.b.c.a.c')).toBeUndefined();

		expect(deepGet(object, 'a.b.c.d')).toBeDefined();
		expect(deepGet(object, 'a.b.c.d.a')).toBeUndefined();
		expect(deepGet(object, 'a.b.c.d.a.c')).toBeUndefined();
	});

	it('should return undefined when trying to access an invalid attribute using an array key', () => {
		expect(deepGet(object as any, ['c'])).toBeUndefined();
		expect(deepGet(object as any, ['c', 'c'])).toBeUndefined();

		expect(deepGet(object, ['a'])).toBeDefined();
		expect(deepGet(object as any, ['a', 'c'])).toBeUndefined();
		expect(deepGet(object as any, ['a', 'c', 'c'])).toBeUndefined();

		expect(deepGet(object, 'a.b')).toBeDefined();
		expect(deepGet(object as any, ['a', 'b', 'a'])).toBeUndefined();
		expect(deepGet(object as any, ['a', 'b', 'a', 'c'])).toBeUndefined();

		expect(deepGet(object, ['a', 'b', 'c'])).toBeDefined();
		// After the third level there's no more type validation
		expect(deepGet(object, ['a', 'b', 'c', 'a'])).toBeUndefined();
		expect(deepGet(object, ['a', 'b', 'c', 'a', 'c'])).toBeUndefined();

		expect(deepGet(object, ['a', 'b', 'c', 'd'])).toBeDefined();
		expect(deepGet(object, ['a', 'b', 'c', 'd', 'a'])).toBeUndefined();
		expect(deepGet(object, ['a', 'b', 'c', 'd', 'a', 'c'])).toBeUndefined();
	});

	it('should return null when accessing an attribute of a non-object', () => {
		expect(deepGet('hi' as any, 'value')).toBeNull();
		expect(deepGet({ a: 'hi' } as any, 'a.value')).toBeNull();
		expect(deepGet({ a: { b: 'hi' } } as any, 'a.b.value')).toBeNull();
		expect(deepGet({ a: { b: { c: 'hi' } } } as any, 'a.b.c.value')).toBeNull();
		expect(deepGet({ a: { b: { c: { d: 'hi' } } } } as any, 'a.b.c.d.value')).toBeNull();

		expect(deepGet(10 as any, 'value')).toBeNull();
		expect(deepGet({ a: 10 } as any, 'a.value')).toBeNull();
		expect(deepGet({ a: { b: 10 } } as any, 'a.b.value')).toBeNull();
		expect(deepGet({ a: { b: { c: 10 } } } as any, 'a.b.c.value')).toBeNull();
		expect(deepGet({ a: { b: { c: { d: 10 } } } } as any, 'a.b.c.d.value')).toBeNull();

		expect(deepGet(false as any, 'value')).toBeNull();
		expect(deepGet({ a: false } as any, 'a.value')).toBeNull();
		expect(deepGet({ a: { b: false } } as any, 'a.b.value')).toBeNull();
		expect(deepGet({ a: { b: { c: false } } } as any, 'a.b.c.value')).toBeNull();
		expect(deepGet({ a: { b: { c: { d: false } } } } as any, 'a.b.c.d.value')).toBeNull();
	});
});
