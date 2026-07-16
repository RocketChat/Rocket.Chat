import { expect } from 'chai';

import { transformMappedData } from '../../../../../app/apps/server/converters/transformMappedData';

describe('transformMappedData', () => {
	it('should map simple string properties and collect unmapped ones', async () => {
		const data = { _id: 'abcde123', size: 10 };
		const map = { id: '_id' };

		const result = await transformMappedData(data, map);

		expect(result).to.deep.equal({
			id: 'abcde123',
			_unmappedProperties_: { size: 10 },
		});
	});

	it('should not mutate the original data object', async () => {
		const data = { a: 1 };
		const map = { b: 'a' };

		await transformMappedData(data, map);

		expect(data).to.deep.equal({ a: 1 });
	});

	it('should allow mapping using a function', async () => {
		const data = { value: 10 };
		const map = {
			double: (d: typeof data) => d.value * 2,
		};

		const result = await transformMappedData(data, map);

		expect(result).to.deep.equal({
			double: 20,
			_unmappedProperties_: { value: 10 },
		});
	});

	it('should delete the unmapped property from the result if we do it explicitly in a function', async () => {
		type User = {
			firstName?: string;
			lastName: string;
		};

		const firstName = 'John';
		const lastName = 'Doe';

		const data: User = { firstName, lastName };
		const map = {
			fullName: (d: User) => {
				const result = `${d.firstName} ${d.lastName}`;
				delete d.firstName;
				return result;
			},
		};

		const result = await transformMappedData(data, map);

		expect(result).to.deep.equal({
			fullName: `${firstName} ${lastName}`,
			_unmappedProperties_: { lastName },
		});
	});

	it('should support async mapping functions', async () => {
		const data = { value: 5 };
		const map = {
			asyncValue: async (d: typeof data) => d.value + 1,
		};

		const result = await transformMappedData(data, map);

		expect(result).to.deep.equal({
			asyncValue: 6,
			_unmappedProperties_: { value: 5 },
		});
	});

	it('should map nested objects using from + map', async () => {
		const data = {
			user: { name: 'John', age: 30 },
		};

		const map = {
			profile: {
				from: 'user',
				map: {
					username: 'name',
				},
			},
		};

		const result = await transformMappedData(data, map);

		expect(result).to.deep.equal({
			profile: {
				username: 'John',
				_unmappedProperties_: { age: 30 },
			},
			_unmappedProperties_: {},
		});
	});

	it('should map lists with nested maps', async () => {
		const data = {
			users: [{ name: 'A' }, { name: 'B' }],
		};

		const map = {
			members: {
				from: 'users',
				list: true,
				map: {
					username: 'name',
				},
			},
		};

		const result = await transformMappedData(data, map);

		expect(result.members).to.deep.equal([
			{ username: 'A', _unmappedProperties_: {} },
			{ username: 'B', _unmappedProperties_: {} },
		]);

		expect(result._unmappedProperties_).to.deep.equal({});
	});

	it('should wrap non-array values into a list when list is true', async () => {
		const data = { tag: 'admin' };

		const map = {
			tags: {
				from: 'tag',
				list: true,
				map: {},
			},
		};

		const result = await transformMappedData(data, map);

		expect(result).to.deep.equal({
			tags: ['admin'],
			_unmappedProperties_: {},
		});
	});

	it('should keep all properties as unmapped when map is empty', async () => {
		const data = { os: 'android', version: '1.9', lan: 'en' };
		const map = {};

		const result = await transformMappedData(data, map);

		expect(result).to.deep.equal({ _unmappedProperties_: data });
	});
});
