import { pluck } from './pluck';

function makeObject(index: number) {
	return {
		value: 10 * index,
		a: {
			value: 20 * index,
			b: {
				value: 30 * index,
				c: {
					value: 40 * index,
					d: {
						e: {
							f: {
								g: {
									value: 50 * index,
								},
							},
						},
					},
				},
			},
		},
	};
}

function multiplyBy(multiplier: number) {
	return (value: number) => {
		return value * multiplier;
	};
}

describe('pluck', () => {
	const indexes = [1, 2, 3, 4];
	const list = indexes.map(makeObject);

	it('should return a list of first level attributes', () => {
		expect(pluck(list, 'value')).toMatchObject(indexes.map(multiplyBy(10)));
	});

	it('should return a list of second level attributes', () => {
		expect(pluck(list, 'a.value')).toMatchObject(indexes.map(multiplyBy(20)));
	});

	it('should return a list of third level attributes', () => {
		expect(pluck(list, 'a.b.value')).toMatchObject(indexes.map(multiplyBy(30)));
	});

	it('should return a list of fourth level attributes', () => {
		expect(pluck(list, 'a.b.c.value')).toMatchObject(indexes.map(multiplyBy(40)));
	});

	it('should return a list of deep nested attributes', () => {
		expect(pluck(list, 'a.b.c.d.e.f.g.value')).toMatchObject(indexes.map(multiplyBy(50)));
	});

	it('should return a list of undefined when acessing attributes that do not exists', () => {
		expect(pluck(list as any, 'b')).toMatchObject(indexes.map(() => undefined));
		expect(pluck(list as any, 'a.c')).toMatchObject(indexes.map(() => undefined));
		expect(pluck(list as any, 'a.b.d')).toMatchObject(indexes.map(() => undefined));
	});

	it('should return a list of nulls when trying to access attributes of a non-object', () => {
		expect(pluck(list as any, 'value.value')).toMatchObject(indexes.map(() => null));
	});
});
