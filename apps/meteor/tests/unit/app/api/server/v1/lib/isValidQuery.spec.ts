import { expect } from 'chai';
import { describe, it } from 'mocha';

import { isValidQuery } from '../../../../../../../app/api/server/lib/isValidQuery';

describe.only('isValidQuery', () => {
	describe('shallow keys', () => {
		it('should return false if the query contains an operation that is not in the props array', () => {
			const props = ['_id', 'name'];
			const query = {
				$or: [
					{
						_id: '123',
					},
					{
						name: '456',
					},
				],
			};
			expect(isValidQuery(query, props, [])).to.be.false;
			expect(isValidQuery.errors.length).to.be.equals(1);
		});

		it('should return true if the query contains operation and the attributes are set in the props array ', () => {
			const props = ['_id', 'name'];
			const query = {
				$or: [
					{
						_id: '123',
					},
					{
						name: '456',
					},
				],
			};
			expect(isValidQuery(query, props, ['$or'])).to.be.true;
			expect(isValidQuery.errors.length).to.be.equals(0);
		});

		it('should return false if the query contains operations allowed but some attributes are not set in the props array ', () => {
			const props = ['name'];
			const query = {
				$or: [
					{
						_id: '123',
					},
					{
						name: '456',
					},
				],
			};
			expect(isValidQuery(query, props, ['$or'])).to.be.false;
			expect(isValidQuery.errors.length).to.be.equals(1);
		});

		it('should return true if the query contains only attributes set in the props array ', () => {
			const props = ['_id', 'name'];
			const query = {
				_id: '123',
				name: '456',
			};
			expect(isValidQuery(query, props, [])).to.be.true;
			expect(isValidQuery.errors.length).to.be.equals(0);
		});

		it('should return false if the query contains an attribute that is not in the props array ', () => {
			const props = ['_id'];
			const query = {
				_id: '123',
				name: '456',
			};
			expect(isValidQuery(query, props, [])).to.be.false;
			expect(isValidQuery.errors.length).to.be.equals(1);
		});
	});

	describe('deep keys', () => {
		it('should return false if the query contains deep attributes that are not set on allowed keys', () => {
			const props = ['_id', 'name'];
			const query = {
				user: {
					_id: '123',
					name: '456',
				},
			};
			expect(isValidQuery(query, props, [])).to.be.false;
			expect(isValidQuery.errors.length).to.be.equals(1);
		});

		it('should return false if the query contains deep attributes that are and are not set as allowed', () => {
			const props = ['user', '_id', 'name'];
			const query = {
				user: {
					_id: '123',
					name: '456',
				},
			};
			expect(isValidQuery(query, props, [])).to.be.false;
			expect(isValidQuery.errors.length).to.be.equals(1);
		});

		it('should return true if the query contains deep attributes that are set on allowed keys', () => {
			const props = ['user', 'user._id', 'user.name'];
			const query = {
				user: {
					_id: '123',
					name: '456',
				},
			};
			expect(isValidQuery(query, props, [])).to.be.true;
			expect(isValidQuery.errors.length).to.be.equals(0);
		});

		it('should return true if the query contains deep attributes that are set on allowed keys even for many layers', () => {
			const props = ['user', 'user._id', 'user.name', 'user.address', 'user.address.city'];
			const query = {
				user: {
					_id: '123',
					name: '456',
					address: {
						city: 'New York',
					},
				},
			};
			expect(isValidQuery(query, props, [])).to.be.true;
			expect(isValidQuery.errors.length).to.be.equals(0);
		});
	});

	describe('using .* for match keys', () => {
		it('should return true if the query contains attributes and * are being used', () => {
			const props = ['user', 'user.*'];
			const query = {
				user: {
					_id: '123',
					name: '456',
				},
			};
			expect(isValidQuery(query, props, [])).to.be.true;
			expect(isValidQuery.errors.length).to.be.equals(0);
		});
	});

	describe('using * for match keys', () => {
		it('should return true if the query contains attributes and * are being used', () => {
			const props = ['user', '*'];
			const query = {
				user: {
					_id: '123',
					name: '456',
				},
			};
			expect(isValidQuery(query, props, [])).to.be.true;
			expect(isValidQuery.errors.length).to.be.equals(0);
		});
		it('should return false if query uses * but the operation is not allowed', () => {
			const props = ['user', '*'];
			const query = {
				$or: [{ user: '123' }, { user: '456' }],
			};
			expect(isValidQuery(query, props, [])).to.be.false;
			expect(isValidQuery.errors.length).to.be.equals(1);
		});
	});

	describe('testing $regex', () => {
		it('should return true if the query contains attributes and * are being used', () => {
			const props = ['user.*'];
			const query = {
				user: {
					_id: '123',
					name: {
						$regex: '*',
					},
				},
			};
			expect(isValidQuery(query, props, ['$or'])).to.be.true;
			expect(isValidQuery.errors.length).to.be.equals(0);
		});

		it('should return false for services.password.reset.token', () => {
			const query = {
				$or: [
					{ 'emails.address': { $regex: '', $options: 'i' } },
					{ username: { $regex: '', $options: 'i' } },
					{ name: { $regex: '', $options: 'i' } },
				],
				$and: [{ username: 'g1' }, { 'services.password.reset.token': { $regex: '.*' } }],
			};
			expect(
				isValidQuery(
					query,
					['name', 'username', 'emails', 'roles', 'status', 'active', 'avatarETag', 'lastLogin', 'email.address.*', 'username.*', 'name.*'],
					['$or', '$and'],
				),
			).to.be.false;
		});
		it('should return false for services.totp.secret', () => {
			const query = {
				$or: [
					{ 'emails.address': { $regex: '', $options: 'i' } },
					{ username: { $regex: '', $options: 'i' } },
					{ name: { $regex: '', $options: 'i' } },
				],
				$and: [{ username: 'g1' }, { 'services.totp.secret': { $regex: '.*' } }],
			};
			expect(
				isValidQuery(
					query,
					['name', 'username', 'emails', 'roles', 'status', 'active', 'avatarETag', 'lastLogin', 'email.address.*', 'username.*', 'name.*'],
					['$or', '$and'],
				),
			).to.be.false;
		});
	});
});
