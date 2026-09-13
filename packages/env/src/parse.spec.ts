import { parseEnv } from './parse';

const MINIMAL_VALID = { MONGO_URL: 'mongodb://localhost:27017/rocketchat' };

describe('parseEnv', () => {
	it('should throw if MONGO_URL is missing', () => {
		expect(() => parseEnv({})).toThrow('Environment variable validation failed');
	});

	it('should throw if MONGO_URL is empty', () => {
		expect(() => parseEnv({ MONGO_URL: '' })).toThrow('Environment variable validation failed');
	});

	it('should return a valid config with only MONGO_URL', () => {
		const result = parseEnv(MINIMAL_VALID);
		expect(result.MONGO_URL).toBe('mongodb://localhost:27017/rocketchat');
	});

	describe('defaults', () => {
		it('should apply string defaults', () => {
			const result = parseEnv(MINIMAL_VALID);
			expect(result.ADMIN_NAME).toBe('Administrator');
			expect(result.ADMIN_USERNAME).toBe('admin');
			expect(result.BIND_IP).toBe('0.0.0.0');
			expect(result.DEPLOY_METHOD).toBe('tar');
			expect(result.DEPLOY_PLATFORM).toBe('selfinstall');
			expect(result.INSTANCE_IP).toBe('localhost');
		});

		it('should apply number defaults', () => {
			const result = parseEnv(MINIMAL_VALID);
			expect(result.PORT).toBe(3000);
			expect(result.EVENT_LOOP_LAG_MS).toBe(70);
			expect(result.HEAP_USAGE_PERCENT).toBe(0.85);
			expect(result.HTTP_FORWARDED_COUNT).toBe(0);
			expect(result.MAX_RESUME_LOGIN_TOKENS).toBe(50);
		});

		it('should allow overriding defaults', () => {
			const result = parseEnv({ ...MINIMAL_VALID, PORT: '8080', ADMIN_NAME: 'Root' });
			expect(result.PORT).toBe(8080);
			expect(result.ADMIN_NAME).toBe('Root');
		});
	});

	describe('type coercion', () => {
		it('should coerce string numbers to numbers', () => {
			const result = parseEnv({ ...MINIMAL_VALID, PORT: '9090', EVENT_LOOP_LAG_MS: '100' });
			expect(result.PORT).toBe(9090);
			expect(result.EVENT_LOOP_LAG_MS).toBe(100);
		});

		it('should coerce optional number strings', () => {
			const result = parseEnv({ ...MINIMAL_VALID, PROMETHEUS_PORT: '9100', HTTP_DEFAULT_TIMEOUT: '5000' });
			expect(result.PROMETHEUS_PORT).toBe(9100);
			expect(result.HTTP_DEFAULT_TIMEOUT).toBe(5000);
		});
	});

	describe('boolean coercion', () => {
		it('should coerce "true" to true', () => {
			const result = parseEnv({ ...MINIMAL_VALID, TEST_MODE: 'true' });
			expect(result.TEST_MODE).toBe(true);
		});

		it('should coerce "false" to false', () => {
			const result = parseEnv({ ...MINIMAL_VALID, TEST_MODE: 'false' });
			expect(result.TEST_MODE).toBe(false);
		});

		it('should coerce "yes" to true', () => {
			const result = parseEnv({ ...MINIMAL_VALID, DISABLE_INTEGRATION_SCRIPTS: 'yes' });
			expect(result.DISABLE_INTEGRATION_SCRIPTS).toBe(true);
		});

		it('should coerce "no" to false', () => {
			const result = parseEnv({ ...MINIMAL_VALID, DISABLE_INTEGRATION_SCRIPTS: 'no' });
			expect(result.DISABLE_INTEGRATION_SCRIPTS).toBe(false);
		});

		it('should coerce "YES" (uppercase) to true', () => {
			const result = parseEnv({ ...MINIMAL_VALID, TEST_MODE: 'YES' });
			expect(result.TEST_MODE).toBe(true);
		});

		it('should leave boolean undefined when not provided', () => {
			const result = parseEnv(MINIMAL_VALID);
			expect(result.TEST_MODE).toBeUndefined();
		});
	});

	describe('additional properties', () => {
		it('should strip unknown env vars from the result', () => {
			const result = parseEnv({ ...MINIMAL_VALID, UNKNOWN_VAR: 'value', ANOTHER: '123' });
			expect((result as Record<string, unknown>).UNKNOWN_VAR).toBeUndefined();
			expect((result as Record<string, unknown>).ANOTHER).toBeUndefined();
		});
	});

	describe('freeze', () => {
		it('should return a frozen object', () => {
			const result = parseEnv(MINIMAL_VALID);
			expect(Object.isFrozen(result)).toBe(true);
		});
	});

	describe('optional strings', () => {
		it('should include optional strings when provided', () => {
			const result = parseEnv({ ...MINIMAL_VALID, ADMIN_EMAIL: 'admin@example.com', REG_TOKEN: 'abc123' });
			expect(result.ADMIN_EMAIL).toBe('admin@example.com');
			expect(result.REG_TOKEN).toBe('abc123');
		});

		it('should leave optional strings undefined when not provided', () => {
			const result = parseEnv(MINIMAL_VALID);
			expect(result.ADMIN_EMAIL).toBeUndefined();
			expect(result.TRANSPORTER).toBeUndefined();
		});
	});
});
