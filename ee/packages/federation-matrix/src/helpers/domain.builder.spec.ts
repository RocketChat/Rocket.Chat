import { Settings } from '@rocket.chat/core-services';

import { getMatrixLocalDomain } from './domain.builder';

// Mock the Settings service
jest.mock('@rocket.chat/core-services', () => ({
	Settings: {
		get: jest.fn(),
	},
}));

describe('getMatrixLocalDomain', () => {
	const mockSettingsGet = Settings.get as jest.MockedFunction<typeof Settings.get>;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('hostname extraction from Site_Url', () => {
		it('should extract hostname from https URL', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('https://example.com');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(443);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('example.com');
		});

		it('should extract hostname from http URL', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('http://example.com');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(80);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('example.com');
		});

		it('should extract hostname from URL with path', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('https://example.com/path/to/app');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(443);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('example.com');
		});

		it('should extract hostname from URL with port in Site_Url', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('https://example.com:3000');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(443);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('example.com');
		});

		it('should handle subdomain correctly', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('https://rc1-garim.tunnel.dev.rocket.chat');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(443);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('rc1-garim.tunnel.dev.rocket.chat');
		});

		it('should handle localhost', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('http://localhost:3000');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(80);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('localhost');
		});

		it('should handle IP addresses', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('http://192.168.1.100:3000');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(80);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('192.168.1.100');
		});
	});

	describe('port handling', () => {
		it('should not append port 443 for default HTTPS', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('https://example.com');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(443);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('example.com');
		});

		it('should not append port 80 for default HTTP', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('http://example.com');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(80);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('example.com');
		});

		it('should append non-standard port', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('https://example.com');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(8448);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('example.com:8448');
		});

		it('should append port 3000', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('http://localhost');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(3000);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('localhost:3000');
		});
	});

	describe('fallback handling for malformed URLs', () => {
		it('should handle URL without protocol using fallback', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('example.com');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(443);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('example.com');
		});

		it('should handle URL with only hostname using fallback', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('my-rocket-chat-server.com');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(443);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('my-rocket-chat-server.com');
		});

		it('should handle hostname with port using fallback', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('example.com:3000');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(8448);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('example.com:8448');
		});

		it('should handle URL that parses but has empty hostname', async () => {
			// This tests the edge case where URL constructor doesn't throw
			// but returns empty hostname (e.g., "file:///path" is valid but has no host)
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('file:///path/to/file');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(8448);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			// file:/// URLs have empty hostname, so it falls back to manual parsing
			// which extracts "file" (everything before the colon)
			expect(result).toBe('file:8448');
		});
	});

	describe('edge cases', () => {
		it('should handle URL with trailing slash', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('https://example.com/');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(443);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('example.com');
		});

		it('should handle URL with query parameters', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('https://example.com?param=value');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(443);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('example.com');
		});

		it('should handle URL with hash', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('https://example.com#section');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(443);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('example.com');
		});

		it('should handle URL with username and password', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('https://user:pass@example.com');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(443);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(result).toBe('example.com');
		});
	});

	describe('error handling', () => {
		it('should throw error when Site_Url is not set', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve(undefined);
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(443);
				return Promise.resolve(undefined);
			});

			await expect(getMatrixLocalDomain()).rejects.toThrow('Matrix domain or port not found');
		});

		it('should throw error when port is not set', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('https://example.com');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(undefined);
				return Promise.resolve(undefined);
			});

			await expect(getMatrixLocalDomain()).rejects.toThrow('Matrix domain or port not found');
		});

		it('should throw error when both are not set', async () => {
			mockSettingsGet.mockImplementation((_key: string) => {
				return Promise.resolve(undefined);
			});

			await expect(getMatrixLocalDomain()).rejects.toThrow('Matrix domain or port not found');
		});

		it('should handle empty Site_Url', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(443);
				return Promise.resolve(undefined);
			});

			await expect(getMatrixLocalDomain()).rejects.toThrow('Matrix domain or port not found');
		});

		it('should handle zero port', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('https://example.com');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(0);
				return Promise.resolve(undefined);
			});

			await expect(getMatrixLocalDomain()).rejects.toThrow('Matrix domain or port not found');
		});
	});

	describe('return type', () => {
		it('should always return a string', async () => {
			mockSettingsGet.mockImplementation((key: string) => {
				if (key === 'Site_Url') return Promise.resolve('https://example.com');
				if (key === 'Federation_Service_Matrix_Port') return Promise.resolve(443);
				return Promise.resolve(undefined);
			});

			const result = await getMatrixLocalDomain();
			expect(typeof result).toBe('string');
		});
	});
});
