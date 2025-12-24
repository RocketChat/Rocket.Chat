import { validateFederatedUsername } from './validateFederatedUsername';

describe('validateFederatedUsername', () => {
	describe('invalid formats', () => {
		it('should return false when mxid does not start with @', () => {
			expect(validateFederatedUsername('user:example.com')).toBe(false);
		});

		it('should return false when localpart contains uppercase letters', () => {
			expect(validateFederatedUsername('@User:example.com')).toBe(false);
		});

		it('should return false when mxid has no colon separator', () => {
			expect(validateFederatedUsername('@user')).toBe(false);
		});

		it('should return false when mxid has empty localpart', () => {
			expect(validateFederatedUsername('@:example.com')).toBe(false);
		});

		it('should return false when localpart contains invalid characters', () => {
			expect(validateFederatedUsername('@user@name:example.com')).toBe(false);
			expect(validateFederatedUsername('@user#name:example.com')).toBe(false);
		});

		it('should return false when localpart exceeds 255 characters', () => {
			const longLocalpart = 'a'.repeat(256);
			expect(validateFederatedUsername(`@${longLocalpart}:example.com`)).toBe(false);
		});

		it('should return false when domain is invalid', () => {
			expect(validateFederatedUsername('@user:invalid_domain')).toBe(false);
			expect(validateFederatedUsername('@user:-example.com')).toBe(false);
		});

		it('should return false when port is invalid', () => {
			expect(validateFederatedUsername('@user:example.com:0')).toBe(false);
			expect(validateFederatedUsername('@user:example.com:65536')).toBe(false);
			expect(validateFederatedUsername('@user:example.com:abc')).toBe(false);
			expect(validateFederatedUsername('@user:example.com:-1')).toBe(false);
		});
	});

	describe('valid formats', () => {
		it('should return true for basic valid mxid', () => {
			expect(validateFederatedUsername('@user:example.com')).toBe(true);
		});

		it('should return true for mxid with dots and hyphens in localpart', () => {
			expect(validateFederatedUsername('@user.name:example.com')).toBe(true);
			expect(validateFederatedUsername('@user-name:example.com')).toBe(true);
			expect(validateFederatedUsername('@user_name:example.com')).toBe(true);
		});

		it('should return true for mxid with encoded characters in localpart', () => {
			expect(validateFederatedUsername('@user=2dname:example.com')).toBe(true);
			expect(validateFederatedUsername('@user=2Dname:example.com')).toBe(true);
		});

		it('should return true for mxid with subdomain', () => {
			expect(validateFederatedUsername('@user:subdomain.example.com')).toBe(true);
		});

		it('should return true for mxid with valid port', () => {
			expect(validateFederatedUsername('@user:example.com:8008')).toBe(true);
			expect(validateFederatedUsername('@user:example.com:1')).toBe(true);
			expect(validateFederatedUsername('@user:example.com:65535')).toBe(true);
		});

		it('should return true for mxid with IPv4 address', () => {
			expect(validateFederatedUsername('@user:192.168.1.1')).toBe(true);
			expect(validateFederatedUsername('@user:192.168.1.1:8008')).toBe(true);
		});

		it.failing('should return true for mxid with IPv6 address', () => {
			expect(validateFederatedUsername('@user:[::1]')).toBe(true);
			expect(validateFederatedUsername('@user:[2001:db8::1]')).toBe(true);
		});

		it('should return true for mxid with numbers in localpart', () => {
			expect(validateFederatedUsername('@user123:example.com')).toBe(true);
			expect(validateFederatedUsername('@123user:example.com')).toBe(true);
		});

		it('should return true for mxid with single character localpart', () => {
			expect(validateFederatedUsername('@a:example.com')).toBe(true);
		});

		it('should return true for mxid with 255 character localpart', () => {
			const maxLocalpart = 'a'.repeat(255);
			expect(validateFederatedUsername(`@${maxLocalpart}:example.com`)).toBe(true);
		});
	});
});
