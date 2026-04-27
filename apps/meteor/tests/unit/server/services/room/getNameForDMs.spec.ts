import { expect } from 'chai';

import { getNameForDMs } from '../../../../../server/services/room/getNameForDMs';

describe('getNameForDMs', () => {
	it('should return empty object when members array is empty', () => {
		const result = getNameForDMs([]);
		expect(result).to.deep.equal({});
	});

	it('should return own name for single member', () => {
		const members = [{ _id: 'user1', name: 'John Doe', username: 'john' }];

		const result = getNameForDMs(members);

		expect(result).to.deep.equal({
			user1: {
				fname: 'John Doe',
				name: 'john',
			},
		});
	});

	it('should return name map for two members using name field', () => {
		const members = [
			{ _id: 'user1', name: 'John Doe', username: 'john' },
			{ _id: 'user2', name: 'Jane Smith', username: 'jane' },
		];

		const result = getNameForDMs(members);

		expect(result).to.deep.equal({
			user1: {
				fname: 'Jane Smith',
				name: 'jane',
			},
			user2: {
				fname: 'John Doe',
				name: 'john',
			},
		});
	});

	it('should fallback to username when name is not available', () => {
		const members = [
			{ _id: 'user1', name: '', username: 'john' },
			{ _id: 'user2', name: '', username: 'jane' },
		];

		const result = getNameForDMs(members);

		expect(result).to.deep.equal({
			user1: {
				fname: 'jane',
				name: 'jane',
			},
			user2: {
				fname: 'john',
				name: 'john',
			},
		});
	});

	it('should handle multiple members and sort them alphabetically', () => {
		const members = [
			{ _id: 'user3', name: 'Charlie Brown', username: 'charlie' },
			{ _id: 'user1', name: 'Alice Wonder', username: 'alice' },
			{ _id: 'user2', name: 'Bob Builder', username: 'bob' },
		];

		const result = getNameForDMs(members);

		expect(result).to.deep.equal({
			user1: {
				fname: 'Bob Builder, Charlie Brown',
				name: 'bob, charlie',
			},
			user2: {
				fname: 'Alice Wonder, Charlie Brown',
				name: 'alice, charlie',
			},
			user3: {
				fname: 'Alice Wonder, Bob Builder',
				name: 'alice, bob',
			},
		});
	});

	it('should handle mix of members with and without names', () => {
		const members = [
			{ _id: 'user1', name: 'Alice Wonder', username: 'alice' },
			{ _id: 'user2', name: '', username: 'bob' },
		];

		const result = getNameForDMs(members);

		expect(result).to.deep.equal({
			user1: {
				fname: 'bob',
				name: 'bob',
			},
			user2: {
				fname: 'Alice Wonder',
				name: 'alice',
			},
		});
	});

	it('should sort by username when names are empty', () => {
		const members = [
			{ _id: 'user1', name: '', username: 'zebra' },
			{ _id: 'user2', name: '', username: 'alpha' },
		];

		const result = getNameForDMs(members);

		expect(result).to.deep.equal({
			user1: {
				fname: 'alpha',
				name: 'alpha',
			},
			user2: {
				fname: 'zebra',
				name: 'zebra',
			},
		});
	});
});
