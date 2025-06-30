import { Matcher } from './Matcher';

describe('constructor', () => {
	it('should create a matcher with string ID', () => {
		const matcher = new Matcher('123');
		expect(matcher.documentMatches({ _id: '123' }).result).toBe(true);
		expect(matcher.documentMatches({ _id: '456' }).result).toBe(false);
	});

	it('should create a matcher with function', () => {
		const matcher = new Matcher<{ _id: string; foo: string }>(function (this) {
			return this.foo === 'bar';
		});
		expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(true);
		expect(matcher.documentMatches({ _id: '123', foo: 'baz' }).result).toBe(false);
	});

	it('should handle null/empty selectors', () => {
		const matcher = new Matcher<{ _id: string }>({ _id: null as any });
		expect(matcher.documentMatches({ _id: '123' }).result).toBe(false);
	});

	it('should throw on invalid selector types', () => {
		expect(() => new Matcher([] as any)).toThrow();
		expect(() => new Matcher(true as any)).toThrow();
	});
});

describe('document matching', () => {
	it('should match simple equality', () => {
		const matcher = new Matcher<{ _id: string; foo: string }>({ foo: 'bar' });
		expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(true);
		expect(matcher.documentMatches({ _id: '123', foo: 'baz' }).result).toBe(false);
	});

	it('should match nested fields', () => {
		const matcher = new Matcher<{ _id: string; foo: { bar: string } }>({ 'foo.bar': 'baz' });
		expect(matcher.documentMatches({ _id: '123', foo: { bar: 'baz' } }).result).toBe(true);
		expect(matcher.documentMatches({ _id: '123', foo: { bar: 'qux' } }).result).toBe(false);
	});

	it('should handle undefined and null', () => {
		const matcher = new Matcher<{ _id: string; foo?: string | null }>({ foo: null });
		expect(matcher.documentMatches({ _id: '123' }).result).toBe(true);
		expect(matcher.documentMatches({ _id: '123', foo: null }).result).toBe(true);
		expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(false);
	});

	it('should throw if passed a non-object', () => {
		const matcher = new Matcher<{ _id: string; foo: string }>({ foo: 'bar' });
		expect(() => matcher.documentMatches('not-an-object' as any)).toThrow();
	});
});

describe('logical operators', () => {
	describe('$and', () => {
		it('should match if all conditions match', () => {
			const matcher = new Matcher<{ _id: string; foo: string; baz: string }>({ $and: [{ foo: 'bar' }, { baz: 'qux' }] });
			expect(matcher.documentMatches({ _id: '123', foo: 'bar', baz: 'qux' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 'bar', baz: 'not-qux' }).result).toBe(false);
		});

		it('should throw if $and is not an array', () => {
			expect(() => new Matcher({ $and: 'not-an-array' } as any)).toThrow();
		});
	});

	describe('$or', () => {
		it('should match if any condition matches', () => {
			const matcher = new Matcher<{ _id: string; foo?: string; baz?: string }>({ $or: [{ foo: 'bar' }, { baz: 'qux' }] });
			expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', baz: 'qux' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 'not-bar', baz: 'not-qux' }).result).toBe(false);
		});

		it('should handle single condition $or', () => {
			const matcher = new Matcher<{ _id: string; foo?: string; baz?: string }>({ $or: [{ foo: 'bar' }] });
			expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 'not-bar' }).result).toBe(false);
		});
	});

	describe('$nor', () => {
		it('should match if no conditions match', () => {
			const matcher = new Matcher<{ _id: string; foo?: string; baz?: string }>({ $nor: [{ foo: 'bar' }, { baz: 'qux' }] });
			expect(matcher.documentMatches({ _id: '123', foo: 'not-bar', baz: 'not-qux' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(false);
			expect(matcher.documentMatches({ _id: '123', baz: 'qux' }).result).toBe(false);
		});
	});

	describe('$where', () => {
		it('should match with function', () => {
			const matcher = new Matcher<{ _id: string; foo?: string }>({
				$where(this) {
					return this.foo === 'bar';
				},
			});
			expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 'not-bar' }).result).toBe(false);
		});

		it('should match with string', () => {
			const matcher = new Matcher<{ _id: string; foo?: string }>({ $where: 'this.foo === "bar"' });
			expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 'not-bar' }).result).toBe(false);
		});
	});

	it('should throw on unknown logical operator', () => {
		expect(() => new Matcher<{ _id: string }>({ $unknown: [] } as any)).toThrow();
	});
});

describe('value operators', () => {
	describe('$eq', () => {
		it('should match equal values', () => {
			const matcher = new Matcher<{ _id: string; foo?: string }>({ foo: { $eq: 'bar' } });
			expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 'not-bar' }).result).toBe(false);
		});
	});

	describe('$ne', () => {
		it('should match non-equal values', () => {
			const matcher = new Matcher<{ _id: string; foo?: string }>({ foo: { $ne: 'bar' } });
			expect(matcher.documentMatches({ _id: '123', foo: 'not-bar' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(false);
		});
	});

	describe('$lt, $lte, $gt, $gte', () => {
		it('should compare with $lt', () => {
			const matcher = new Matcher<{ _id: string; foo?: number }>({ foo: { $lt: 5 } });
			expect(matcher.documentMatches({ _id: '123', foo: 3 }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 5 }).result).toBe(false);
			expect(matcher.documentMatches({ _id: '123', foo: 7 }).result).toBe(false);
		});

		it('should compare with $lte', () => {
			const matcher = new Matcher<{ _id: string; foo?: number }>({ foo: { $lte: 5 } });
			expect(matcher.documentMatches({ _id: '123', foo: 3 }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 5 }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 7 }).result).toBe(false);
		});

		it('should compare with $gt', () => {
			const matcher = new Matcher<{ _id: string; foo?: number }>({ foo: { $gt: 5 } });
			expect(matcher.documentMatches({ _id: '123', foo: 7 }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 5 }).result).toBe(false);
			expect(matcher.documentMatches({ _id: '123', foo: 3 }).result).toBe(false);
		});

		it('should compare with $gte', () => {
			const matcher = new Matcher<{ _id: string; foo?: number }>({ foo: { $gte: 5 } });
			expect(matcher.documentMatches({ _id: '123', foo: 7 }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 5 }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 3 }).result).toBe(false);
		});

		it('should handle type mismatches', () => {
			const matcher = new Matcher<{ _id: string; foo?: number }>({ foo: { $lt: 5 } });
			expect(matcher.documentMatches({ _id: '123', foo: 'string' as any }).result).toBe(false);
		});
	});

	describe('$in', () => {
		it('should match values in an array', () => {
			const matcher = new Matcher<{ _id: string; foo?: number }>({ foo: { $in: [1, 2, 3] } });
			expect(matcher.documentMatches({ _id: '123', foo: 2 }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 5 }).result).toBe(false);
		});

		it('should handle regex in $in', () => {
			const matcher = new Matcher<{ _id: string; foo?: string }>({ foo: { $in: [/^bar/] } });
			expect(matcher.documentMatches({ _id: '123', foo: 'bart' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 'qux' }).result).toBe(false);
		});

		it('should throw with operators in $in', () => {
			expect(() => new Matcher<{ _id: string; foo?: number }>({ foo: { $in: [{ $gt: 5 }] as any } })).toThrow();
		});

		it('should throw if $in value is not an array', () => {
			expect(() => new Matcher<{ _id: string; foo?: number }>({ foo: { $in: 'not-an-array' } } as any)).toThrow();
		});
	});

	describe('$nin', () => {
		it('should match values not in an array', () => {
			const matcher = new Matcher<{ _id: string; foo?: number }>({ foo: { $nin: [1, 2, 3] } });
			expect(matcher.documentMatches({ _id: '123', foo: 5 }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 2 }).result).toBe(false);
		});
	});

	describe('$exists', () => {
		it('should match if field exists', () => {
			const matcher = new Matcher<{ _id: string; foo?: string }>({ foo: { $exists: true } });
			expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123' }).result).toBe(false);
		});

		it('should match if field does not exist', () => {
			const matcher = new Matcher<{ _id: string; foo?: string }>({ foo: { $exists: false } });
			expect(matcher.documentMatches({ _id: '123' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(false);
		});
	});

	describe('$mod', () => {
		it('should match numbers with correct modulo', () => {
			const matcher = new Matcher<{ _id: string; foo?: number }>({ foo: { $mod: [3, 1] } });
			expect(matcher.documentMatches({ _id: '123', foo: 4 }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 5 }).result).toBe(false);
		});

		it('should throw if $mod is not an array with two numbers', () => {
			expect(() => new Matcher<{ _id: string; foo?: number }>({ foo: { $mod: 'not-array' } } as any)).toThrow();
			expect(() => new Matcher<{ _id: string; foo?: number }>({ foo: { $mod: [1] } } as any)).toThrow();
			expect(() => new Matcher<{ _id: string; foo?: number }>({ foo: { $mod: ['1', '2'] } } as any)).toThrow();
		});
	});

	describe('$size', () => {
		it('should match arrays with specified size', () => {
			const matcher = new Matcher<{ _id: string; foo?: number[] }>({ foo: { $size: 2 } });
			expect(matcher.documentMatches({ _id: '123', foo: [1, 2] }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: [1] }).result).toBe(false);
			expect(matcher.documentMatches({ _id: '123', foo: 'not-array' as any }).result).toBe(false);
		});

		it('should convert string size to 0', () => {
			const matcher = new Matcher<{ _id: string; foo?: number[] }>({ foo: { $size: '2' as any } });
			expect(matcher.documentMatches({ _id: '123', foo: [] }).result).toBe(true);
		});

		it('should throw if size is not a number or string', () => {
			expect(() => new Matcher<{ _id: string; foo?: number[] }>({ foo: { $size: {} } } as any)).toThrow();
		});
	});

	describe('$type', () => {
		it('should match values of specified type (number code)', () => {
			const matcher = new Matcher<{ _id: string; foo?: unknown }>({ foo: { $type: 2 } }); // string
			expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 123 }).result).toBe(false);
		});

		it('should match values of specified type (string name)', () => {
			const matcher = new Matcher<{ _id: string; foo?: unknown }>({ foo: { $type: 'string' } });
			expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 123 }).result).toBe(false);
		});

		it('should throw on invalid type code', () => {
			expect(() => new Matcher<{ _id: string; foo?: unknown }>({ foo: { $type: 999 } })).toThrow();
		});

		it('should throw on invalid type name', () => {
			expect(() => new Matcher<{ _id: string; foo?: unknown }>({ foo: { $type: 'not-a-type' } })).toThrow();
		});

		it('should throw if type is not a string or number', () => {
			expect(() => new Matcher<{ _id: string; foo?: unknown }>({ foo: { $type: {} } } as any)).toThrow();
		});
	});

	describe('$regex', () => {
		it('should match strings with regexp', () => {
			const matcher = new Matcher<{ _id: string; foo?: string }>({ foo: { $regex: '^bar' } });
			expect(matcher.documentMatches({ _id: '123', foo: 'bart' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 'qux' }).result).toBe(false);
		});

		it('should use $options if provided', () => {
			const matcher = new Matcher<{ _id: string; foo?: string }>({ foo: { $regex: 'BAR', $options: 'i' } });
			expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(true);
		});

		it('should throw on invalid $options', () => {
			expect(() => new Matcher<{ _id: string; foo?: string }>({ foo: { $regex: 'bar', $options: 'z' } })).toThrow();
		});

		it('should throw if regex is not a string or RegExp', () => {
			expect(() => new Matcher<{ _id: string; foo?: string }>({ foo: { $regex: 123 } } as any)).toThrow();
		});

		it('should match direct RegExp', () => {
			const matcher = new Matcher<{ _id: string; foo?: string }>({ foo: /^bar/ });
			expect(matcher.documentMatches({ _id: '123', foo: 'bart' }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 'qux' }).result).toBe(false);
		});
	});

	describe('$options', () => {
		it('should throw without $regex', () => {
			expect(() => new Matcher<{ _id: string; foo?: string }>({ foo: { $options: 'i' } })).toThrow();
		});
	});

	describe('$elemMatch', () => {
		it('should match array elements that match document', () => {
			const matcher = new Matcher<{ _id: string; foo?: { bar: string }[] }>({ foo: { $elemMatch: { bar: 'baz' } } });
			expect(matcher.documentMatches({ _id: '123', foo: [{ bar: 'baz' }] }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: [{ bar: 'qux' }] }).result).toBe(false);
		});

		it('should match array elements that match operator', () => {
			const matcher = new Matcher<{ _id: string; foo?: { bar: number }[] }>({ foo: { $elemMatch: { bar: { $gt: 5 } } } });
			expect(matcher.documentMatches({ _id: '123', foo: [{ bar: 10 }] }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: [{ bar: 3 }] }).result).toBe(false);
		});

		it('should handle non-arrays', () => {
			const matcher = new Matcher<{ _id: string; foo?: string }>({ foo: { $elemMatch: { bar: 'baz' } } });
			expect(matcher.documentMatches({ _id: '123', foo: 'not-array' }).result).toBe(false);
		});

		it('should throw if elemMatch is not an object', () => {
			expect(() => new Matcher<{ _id: string; foo?: unknown }>({ foo: { $elemMatch: 'not-object' } } as any)).toThrow();
		});
	});

	describe('$not', () => {
		it('should negate matchers', () => {
			const matcher = new Matcher<{ _id: string; foo?: number }>({ foo: { $not: { $gt: 5 } } });
			expect(matcher.documentMatches({ _id: '123', foo: 3 }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: 7 }).result).toBe(false);
		});
	});

	describe('$all', () => {
		it('should match arrays containing all specified elements', () => {
			const matcher = new Matcher<{ _id: string; foo?: number[] }>({ foo: { $all: [1, 2] } });
			expect(matcher.documentMatches({ _id: '123', foo: [1, 2, 3] }).result).toBe(true);
			expect(matcher.documentMatches({ _id: '123', foo: [1, 3] }).result).toBe(false);
		});

		it('should throw if $all is not an array', () => {
			expect(() => new Matcher<{ _id: string; foo?: number[] }>({ foo: { $all: 'not-an-array' } } as any)).toThrow();
		});

		it('should throw if $all contains $ expressions', () => {
			expect(() => new Matcher<{ _id: string; foo?: number[] }>({ foo: { $all: [{ $gt: 5 }] } })).toThrow();
		});
	});

	describe('bitmask operators', () => {
		describe('$bitsAllSet', () => {
			it('should match if all bits are set', () => {
				const matcher = new Matcher<{ _id: string; foo: number }>({ foo: { $bitsAllSet: 0b101 } });
				expect(matcher.documentMatches({ _id: '123', foo: 0b111 }).result).toBe(true);
				expect(matcher.documentMatches({ _id: '123', foo: 0b011 }).result).toBe(false);
			});
		});

		describe('$bitsAnySet', () => {
			it('should match if any bits are set', () => {
				const matcher = new Matcher<{ _id: string; foo: number }>({ foo: { $bitsAnySet: 0b111 } });
				expect(matcher.documentMatches({ _id: '123', foo: 0b010 }).result).toBe(true);
				expect(matcher.documentMatches({ _id: '123', foo: 0b1000 }).result).toBe(false);
			});
		});

		describe('$bitsAllClear', () => {
			it('should match if all bits are clear', () => {
				const matcher = new Matcher<{ _id: string; foo?: number }>({ foo: { $bitsAllClear: 0b101 } });
				expect(matcher.documentMatches({ _id: '123', foo: 0b010 }).result).toBe(true);
				expect(matcher.documentMatches({ _id: '123', foo: 0b111 }).result).toBe(false);
			});
		});

		describe('$bitsAnyClear', () => {
			it('should match if any bits are clear', () => {
				const matcher = new Matcher<{ _id: string; foo?: number }>({ foo: { $bitsAnyClear: 0b101 } });
				expect(matcher.documentMatches({ _id: '123', foo: 0b100 }).result).toBe(true);
				expect(matcher.documentMatches({ _id: '123', foo: 0b101 }).result).toBe(false);
			});
		});
	});
});

describe('nested fields and arrays', () => {
	it('should match nested fields', () => {
		const matcher = new Matcher<{ _id: string; foo?: { bar: string } }>({ 'foo.bar': 'baz' });
		expect(matcher.documentMatches({ _id: '123', foo: { bar: 'baz' } }).result).toBe(true);
	});

	it('should match arrays using numerical indices', () => {
		const matcher = new Matcher<{ _id: string; foo?: string[] }>({ 'foo.0': 'bar' });
		expect(matcher.documentMatches({ _id: '123', foo: ['bar', 'baz'] }).result).toBe(true);
		expect(matcher.documentMatches({ _id: '123', foo: ['baz', 'bar'] }).result).toBe(false);
	});

	it('should match array elements at any position', () => {
		const matcher = new Matcher<{ _id: string; foo?: string[] }>({ foo: 'bar' });
		expect(matcher.documentMatches({ _id: '123', foo: ['bar', 'baz'] }).result).toBe(true);
		expect(matcher.documentMatches({ _id: '123', foo: ['baz', 'bar'] }).result).toBe(true);
	});

	it('should handle arrays in arrays', () => {
		const matcher = new Matcher<{ _id: string; foo?: { bar: string }[] }>({ 'foo.bar': 'baz' });
		expect(matcher.documentMatches({ _id: '123', foo: [{ bar: 'baz' }] }).result).toBe(true);
	});

	it('should handle array indices in nested fields', () => {
		const matcher = new Matcher<{ _id: string; foo?: { bar: string }[] }>({ 'foo.0.bar': 'baz' });
		expect(matcher.documentMatches({ _id: '123', foo: [{ bar: 'baz' }] }).result).toBe(true);
		expect(matcher.documentMatches({ _id: '123', foo: [{ bar: 'qux' }] }).result).toBe(false);
	});
});

describe('complex queries', () => {
	it('should handle combination of logical and value operators', () => {
		const matcher = new Matcher<{ _id: string; foo?: number; bar?: string; qux?: string | null }>({
			$and: [{ foo: { $gt: 5 } }, { $or: [{ bar: 'baz' }, { qux: { $exists: true } }] }],
		});
		expect(matcher.documentMatches({ _id: '123', foo: 10, bar: 'baz' }).result).toBe(true);
		expect(matcher.documentMatches({ _id: '123', foo: 10, qux: null }).result).toBe(true);
		expect(matcher.documentMatches({ _id: '123', foo: 10 }).result).toBe(false);
		expect(matcher.documentMatches({ _id: '123', foo: 3, bar: 'baz' }).result).toBe(false);
	});
});

describe('edge cases', () => {
	it('should handle empty selectors', () => {
		const matcher = new Matcher({});
		expect(matcher.documentMatches({ _id: '123' }).result).toBe(true);
	});

	it('should handle multiple top-level keys', () => {
		const matcher = new Matcher<{ _id: string; foo?: string; baz?: string }>({ foo: 'bar', baz: 'qux' });
		expect(matcher.documentMatches({ _id: '123', foo: 'bar', baz: 'qux' }).result).toBe(true);
		expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(false);
	});

	it('should handle function values in selector', () => {
		// Functions should just be ignored (they're skipped in the compile process)
		const selector = {
			foo: 'bar',
			func() {
				return true;
			},
		};
		const matcher = new Matcher<{ _id: string; foo?: string }>(selector);
		expect(matcher.documentMatches({ _id: '123', foo: 'bar' }).result).toBe(true);
	});
});
