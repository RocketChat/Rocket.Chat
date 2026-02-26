import crypto from 'node:crypto';

import { hashLoginToken } from './index.js';

describe('hashLoginToken', () => {
	it('should return a base64 encoded SHA256 hash of the login token', () => {
		const token = 'test-login-token';
		const result = hashLoginToken(token);

		// Manually compute expected hash
		const expectedHash = crypto.createHash('sha256').update(token).digest('base64');

		expect(result).toBe(expectedHash);
	});

	it('should return consistent hash for the same input', () => {
		const token = 'consistent-token';
		const result1 = hashLoginToken(token);
		const result2 = hashLoginToken(token);

		expect(result1).toBe(result2);
	});

	it('should return different hashes for different inputs', () => {
		const token1 = 'token-one';
		const token2 = 'token-two';

		const result1 = hashLoginToken(token1);
		const result2 = hashLoginToken(token2);

		expect(result1).not.toBe(result2);
	});

	it('should handle empty string', () => {
		const result = hashLoginToken('');

		// SHA256 of empty string in base64
		const expectedHash = crypto.createHash('sha256').update('').digest('base64');

		expect(result).toBe(expectedHash);
	});

	it('should handle special characters', () => {
		const token = '!@#$%^&*()_+-=[]{}|;:,.<>?';
		const result = hashLoginToken(token);

		const expectedHash = crypto.createHash('sha256').update(token).digest('base64');

		expect(result).toBe(expectedHash);
	});

	it('should handle unicode characters', () => {
		const token = '你好世界🚀';
		const result = hashLoginToken(token);

		const expectedHash = crypto.createHash('sha256').update(token).digest('base64');

		expect(result).toBe(expectedHash);
	});
});
