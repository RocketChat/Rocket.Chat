import { randomBytes } from 'node:crypto';

import { CalendarSecretBox } from './secretBox';

describe('CalendarSecretBox', () => {
	it('encrypts credentials with authenticated context and does not retain plaintext', () => {
		const box = CalendarSecretBox.fromBase64Key(randomBytes(32).toString('base64'));
		const encrypted = box.encrypt('client-secret-value', 'tenant-a:client-secret');
		expect(encrypted).not.toContain('client-secret-value');
		expect(box.decrypt(encrypted, 'tenant-a:client-secret')).toBe('client-secret-value');
		expect(() => box.decrypt(encrypted, 'tenant-b:client-secret')).toThrow();
	});

	it('refuses missing and undersized deployment keys', () => {
		expect(() => CalendarSecretBox.fromBase64Key(undefined)).toThrow('enterprise-calendar-encryption-key-required');
		expect(() => CalendarSecretBox.fromBase64Key(Buffer.alloc(16).toString('base64'))).toThrow(
			'enterprise-calendar-encryption-key-must-be-32-bytes',
		);
	});
});
