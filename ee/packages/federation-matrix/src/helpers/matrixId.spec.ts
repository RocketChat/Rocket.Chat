import type { IUser } from '@rocket.chat/core-typings';

import { constructMatrixId, getUserMatrixId, validateFederatedUsername } from './matrixId';

describe('Federation - Infrastructure - Matrix - matrixId helpers', () => {
	describe('#validateFederatedUsername()', () => {
		it('should validate valid Matrix User IDs', () => {
			expect(validateFederatedUsername('@alice:matrix.org')).toBe(true);
			expect(validateFederatedUsername('@user:example.com')).toBe(true);
			expect(validateFederatedUsername('@test.user:server.domain.io')).toBe(true);
		});

		it('should validate Matrix User IDs with ports', () => {
			expect(validateFederatedUsername('@alice:localhost:8008')).toBe(true);
			expect(validateFederatedUsername('@user:192.168.1.1:8448')).toBe(true);
		});

		it('should validate Matrix User IDs with IPv4 addresses', () => {
			expect(validateFederatedUsername('@user:192.168.1.1')).toBe(true);
			expect(validateFederatedUsername('@test:10.0.0.1')).toBe(true);
		});

		it('should reject invalid formats', () => {
			expect(validateFederatedUsername('alice:matrix.org')).toBe(false); // missing @
			expect(validateFederatedUsername('@alice')).toBe(false); // missing domain
			expect(validateFederatedUsername('alice')).toBe(false); // not a Matrix ID
			expect(validateFederatedUsername('@:matrix.org')).toBe(false); // empty localpart
		});

		it('should reject invalid localparts', () => {
			expect(validateFederatedUsername('@ALICE:matrix.org')).toBe(false); // uppercase
			expect(validateFederatedUsername('@alice!:matrix.org')).toBe(false); // invalid char
			expect(validateFederatedUsername('@alice bob:matrix.org')).toBe(false); // space
		});

		it('should reject invalid ports', () => {
			expect(validateFederatedUsername('@alice:matrix.org:99999')).toBe(false); // port too large
			expect(validateFederatedUsername('@alice:matrix.org:0')).toBe(false); // port too small
			expect(validateFederatedUsername('@alice:matrix.org:abc')).toBe(false); // non-numeric port
		});
	});

	describe('#constructMatrixId()', () => {
		it('should construct valid Matrix ID', () => {
			expect(constructMatrixId('alice', 'example.com')).toBe('@alice:example.com');
			expect(constructMatrixId('bob', 'matrix.org')).toBe('@bob:matrix.org');
		});

		it('should sanitize username: convert to lowercase', () => {
			expect(constructMatrixId('Alice', 'example.com')).toBe('@alice:example.com');
			expect(constructMatrixId('JOHN', 'example.com')).toBe('@john:example.com');
		});

		it('should sanitize username: replace invalid characters', () => {
			expect(constructMatrixId('Alice!Bob', 'example.com')).toBe('@alice_bob:example.com');
			expect(constructMatrixId('User Name', 'server.com')).toBe('@user_name:server.com');
			expect(constructMatrixId('user@domain', 'server.com')).toBe('@user_domain:server.com');
		});

		it('should sanitize username: preserve valid characters (. _ - =)', () => {
			expect(constructMatrixId('alice.bob', 'example.com')).toBe('@alice.bob:example.com');
			expect(constructMatrixId('user_name', 'example.com')).toBe('@user_name:example.com');
			expect(constructMatrixId('test-user', 'example.com')).toBe('@test-user:example.com');
			expect(constructMatrixId('user=123', 'example.com')).toBe('@user=123:example.com');
		});

		it('should sanitize username: remove leading/trailing underscores', () => {
			expect(constructMatrixId('_alice_', 'example.com')).toBe('@alice:example.com');
			expect(constructMatrixId('___test___', 'example.com')).toBe('@test:example.com');
		});

		it('should use fallback "user" for all-invalid characters', () => {
			expect(constructMatrixId('___', 'example.com')).toBe('@user:example.com');
			expect(constructMatrixId('!!!', 'example.com')).toBe('@user:example.com');
		});

		it('should throw error for empty server name', () => {
			expect(() => constructMatrixId('alice', '')).toThrow('Server name cannot be empty');
		});

		it('should handle server names with ports', () => {
			expect(constructMatrixId('alice', 'example.com:8448')).toBe('@alice:example.com:8448');
		});

		it('should validate server name format: valid hostnames', () => {
			expect(constructMatrixId('alice', 'example.com')).toBe('@alice:example.com');
			expect(constructMatrixId('alice', 'sub.domain.example.com')).toBe('@alice:sub.domain.example.com');
			expect(constructMatrixId('alice', 'localhost')).toBe('@alice:localhost');
		});

		it('should validate server name format: valid IPv4 addresses', () => {
			expect(constructMatrixId('alice', '192.168.1.1')).toBe('@alice:192.168.1.1');
			expect(constructMatrixId('alice', '10.0.0.1')).toBe('@alice:10.0.0.1');
		});

		it('should validate server name format: valid IPv6 addresses', () => {
			expect(constructMatrixId('alice', '[::1]')).toBe('@alice:[::1]');
			expect(constructMatrixId('alice', '[2001:db8::1]')).toBe('@alice:[2001:db8::1]');
		});

		it('should validate server name format: valid ports', () => {
			expect(constructMatrixId('alice', 'example.com:8448')).toBe('@alice:example.com:8448');
			expect(constructMatrixId('alice', 'localhost:8008')).toBe('@alice:localhost:8008');
			expect(constructMatrixId('alice', '192.168.1.1:8448')).toBe('@alice:192.168.1.1:8448');
		});

		it('should reject server name with spaces', () => {
			expect(() => constructMatrixId('alice', 'example .com')).toThrow('Server name cannot contain spaces');
			expect(() => constructMatrixId('alice', ' example.com')).toThrow('Server name cannot contain leading or trailing whitespace');
			expect(() => constructMatrixId('alice', 'example.com ')).toThrow('Server name cannot contain leading or trailing whitespace');
		});

		it('should reject invalid server name formats', () => {
			expect(() => constructMatrixId('alice', 'invalid..domain')).toThrow('Invalid server name format');
			expect(() => constructMatrixId('alice', '-invalid.com')).toThrow('Invalid server name format');
			expect(() => constructMatrixId('alice', 'invalid-.com')).toThrow('Invalid server name format');
		});

		it('should reject invalid ports', () => {
			expect(() => constructMatrixId('alice', 'example.com:0')).toThrow('Invalid port in server name: 0 (must be 1-65535)');
			expect(() => constructMatrixId('alice', 'example.com:99999')).toThrow('Invalid port in server name: 99999 (must be 1-65535)');
			expect(() => constructMatrixId('alice', 'example.com:abc')).toThrow('Invalid port in server name: abc (must be 1-65535)');
		});
	});

	describe('#getUserMatrixId()', () => {
		const mockServerName = 'example.com';

		it('should return existing Matrix ID for native federated user', () => {
			const user = {
				_id: 'user1',
				username: 'alice',
				federated: true,
				federation: {
					version: 1,
					mui: '@alice:example.com',
					origin: 'example.com',
				},
			} as Pick<IUser, '_id' | 'username' | 'federated' | 'federation'>;

			const result = getUserMatrixId(user, mockServerName);
			expect(result).toBe('@alice:example.com');
		});

		it('should throw error for native federated user without mui', () => {
			const user = {
				_id: 'user2',
				username: 'bob',
				federated: true,
				federation: {
					version: 1,
					origin: 'example.com',
				},
			} as Pick<IUser, '_id' | 'username' | 'federated' | 'federation'>;

			expect(() => getUserMatrixId(user, mockServerName)).toThrow('Native federated user user2 is missing Matrix ID (mui)');
		});

		it('should generate Matrix ID for local user without storing', () => {
			const user = {
				_id: 'user3',
				username: 'carol',
			} as Pick<IUser, '_id' | 'username' | 'federated' | 'federation'>;

			const result = getUserMatrixId(user, mockServerName);
			expect(result).toBe('@carol:example.com');
		});

		it('should sanitize username when generating Matrix ID for local user', () => {
			const user = {
				_id: 'user4',
				username: 'Alice!Bob',
			} as Pick<IUser, '_id' | 'username' | 'federated' | 'federation'>;

			const result = getUserMatrixId(user, mockServerName);
			expect(result).toBe('@alice_bob:example.com');
		});

		it('should throw error for user without username', () => {
			const user = {
				_id: 'user5',
			} as Pick<IUser, '_id' | 'username' | 'federated' | 'federation'>;

			expect(() => getUserMatrixId(user, mockServerName)).toThrow('User user5 has no username, cannot generate Matrix ID');
		});

		it('should return stored mui even if username changed (immutable)', () => {
			const user = {
				_id: 'user6',
				username: 'newusername',
				federated: true,
				federation: {
					version: 1,
					mui: '@oldusername:example.com',
					origin: 'example.com',
				},
			} as Pick<IUser, '_id' | 'username' | 'federated' | 'federation'>;

			const result = getUserMatrixId(user, mockServerName);
			expect(result).toBe('@oldusername:example.com');
		});
	});
});
