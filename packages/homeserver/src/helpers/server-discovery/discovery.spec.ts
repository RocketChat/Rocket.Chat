import { afterEach, describe, expect, it, jest, mock } from 'bun:test';
import {
	addressWithDefaultPort,
	getAddressFromTargetWellKnownEndpoint,
	getWellKnownCachedAddress,
	isIpLiteral,
	resolveHostAddressByServerName,
	resolveUsingSRVRecordsOrFallbackToOtherRecords,
	resolveWhenServerNameIsAddressWithPort,
	resolveWhenServerNameIsIpAddress,
	wellKnownCache,
} from './discovery';

const mockResolver = {
	resolveAny: jest.fn(),
	resolveSrv: jest.fn(),
};

mock.module('node:dns/promises', () => ({
	Resolver: jest.fn(() => mockResolver),
}));

describe('#isIpLiteral()', () => {
	it('should return true for valid IPv4 addresses', () => {
		expect(isIpLiteral('192.168.1.1')).toBe(true);
		expect(isIpLiteral('127.0.0.1')).toBe(true);
	});

	it('should return true for valid IPv6 addresses', () => {
		expect(isIpLiteral('::1')).toBe(true);
		expect(isIpLiteral('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
	});

	it('should return false for invalid IP addresses', () => {
		expect(isIpLiteral('999.999.999.999')).toBe(false);
		expect(isIpLiteral('invalid-ip')).toBe(false);
	});

	it('should return false for empty string', () => {
		expect(isIpLiteral('')).toBe(false);
	});

	it('should return false for non-IP strings', () => {
		expect(isIpLiteral('hello world')).toBe(false);
	});

	it('should return true for IP addresses with ports', () => {
		expect(isIpLiteral('192.168.1.1:8080')).toBe(true);
		expect(isIpLiteral('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:443')).toBe(
			true,
		);
	});
});

describe('#addressWithDefaultPort()', () => {
	it('should append default port 8448 to IPv4 address', () => {
		expect(addressWithDefaultPort('192.168.1.1')).toBe('192.168.1.1:8448');
	});

	it('should append default port 8448 to IPv6 address', () => {
		expect(
			addressWithDefaultPort('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]'),
		).toBe('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:8448');
	});

	it('should append default port 8448 to domain name', () => {
		expect(addressWithDefaultPort('example.com')).toBe('example.com:8448');
	});
});

describe('#resolveWhenServerNameIsIpAddress()', () => {
	it('should return the same address with port if IPv4 address has a port', async () => {
		const result = await resolveWhenServerNameIsIpAddress('192.168.1.1:8080');
		expect(result).toBe('192.168.1.1:8080');
	});

	it('should return the same address with port if IPv6 address has a port', async () => {
		const result = await resolveWhenServerNameIsIpAddress(
			'[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:443',
		);
		expect(result).toBe('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:443');
	});

	it('should append default port 8448 if IPv4 address does not have a port', async () => {
		const result = await resolveWhenServerNameIsIpAddress('192.168.1.1');
		expect(result).toBe('192.168.1.1:8448');
	});

	it('should append default port 8448 if IPv6 address does not have a port', async () => {
		const result = await resolveWhenServerNameIsIpAddress(
			'2001:0db8:85a3:0000:0000:8a2e:0370:7334',
		);
		expect(result).toBe('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:8448');
	});

	it('should return the same address if it is a valid IPv4 address with default port', async () => {
		const result = await resolveWhenServerNameIsIpAddress('192.168.1.1:8448');
		expect(result).toBe('192.168.1.1:8448');
	});

	it('should return the same address if it is a valid IPv6 address with default port', async () => {
		const result = await resolveWhenServerNameIsIpAddress(
			'[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:8448',
		);
		expect(result).toBe('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:8448');
	});

	it('should return the provided string with the default port for invalid IP addresses', async () => {
		const result = await resolveWhenServerNameIsIpAddress('invalid');
		expect(result).toBe('invalid:8448');
	});

	it('should throw an error if the URL is not parseable', async () => {
		await expect(
			resolveWhenServerNameIsIpAddress('::invalid'),
		).rejects.toThrow();
	});
});

describe('#resolveWhenServerNameIsAddressWithPort()', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should resolve to CNAME record with port', async () => {
		mockResolver.resolveAny.mockResolvedValueOnce([
			{ type: 'CNAME', value: 'alias.example.com' },
		]);

		const result =
			await resolveWhenServerNameIsAddressWithPort('example.com:8080');
		expect(result).toBe('alias.example.com:8080');
	});

	it('should resolve to AAAA record with port', async () => {
		mockResolver.resolveAny.mockResolvedValueOnce([
			{
				type: 'AAAA',
				address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
				ttl: 300,
			},
		]);

		const result =
			await resolveWhenServerNameIsAddressWithPort('example.com:8080');
		expect(result).toBe('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:8080');
	});

	it('should resolve to A record with port', async () => {
		mockResolver.resolveAny.mockResolvedValueOnce([
			{ type: 'A', address: '192.168.1.1', ttl: 300 },
		]);

		const result =
			await resolveWhenServerNameIsAddressWithPort('example.com:8080');
		expect(result).toBe('192.168.1.1:8080');
	});

	it('should return the same address with its port if no records are found', async () => {
		mockResolver.resolveAny.mockResolvedValueOnce([]);

		const result =
			await resolveWhenServerNameIsAddressWithPort('example.com:8080');
		expect(result).toBe('example.com:8080');
	});

	it('should throw an error if an error occurs during resolution', async () => {
		mockResolver.resolveAny.mockRejectedValueOnce(
			new Error('DNS resolution error'),
		);

		await expect(
			resolveWhenServerNameIsAddressWithPort('example.com:8080'),
		).rejects.toThrow('DNS resolution error');
	});
});

describe('#resolveUsingSRVRecordsOrFallbackToOtherRecords()', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should resolve to SRV record target with default port', async () => {
		mockResolver.resolveSrv = jest
			.fn()
			.mockResolvedValue([
				{ name: 'srv.example.com', port: 8448, priority: 10, weight: 5 },
			]);
		mockResolver.resolveAny.mockResolvedValueOnce([
			{ type: 'A', address: '192.168.1.1', ttl: 300 },
		]);

		const result =
			await resolveUsingSRVRecordsOrFallbackToOtherRecords('example.com');
		expect(result).toBe('192.168.1.1:8448');
	});

	it('should resolve to SRV record target with specified port', async () => {
		mockResolver.resolveSrv = jest
			.fn()
			.mockResolvedValue([
				{ name: 'srv.example.com', port: 8448, priority: 10, weight: 5 },
			]);
		mockResolver.resolveAny.mockResolvedValueOnce([
			{ type: 'A', address: '192.168.1.1', ttl: 300 },
		]);

		const result =
			await resolveUsingSRVRecordsOrFallbackToOtherRecords('example.com');
		expect(result).toBe('192.168.1.1:8448');
	});

	it('should resolve to AAAA record if no SRV records are found', async () => {
		mockResolver.resolveSrv = jest.fn().mockResolvedValue([]);
		mockResolver.resolveAny.mockResolvedValueOnce([
			{
				type: 'AAAA',
				address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
				ttl: 300,
			},
		]);

		const result =
			await resolveUsingSRVRecordsOrFallbackToOtherRecords('example.com');
		expect(result).toBe('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:8448');
	});

	it('should resolve to A record if no SRV records are found', async () => {
		mockResolver.resolveSrv = jest.fn().mockResolvedValue([]);
		mockResolver.resolveAny.mockResolvedValueOnce([
			{ type: 'A', address: '192.168.1.1', ttl: 300 },
		]);

		const result =
			await resolveUsingSRVRecordsOrFallbackToOtherRecords('example.com');
		expect(result).toBe('192.168.1.1:8448');
	});

	it('should return the same address with default port if no records are found', async () => {
		mockResolver.resolveSrv = jest.fn().mockResolvedValue([]);
		mockResolver.resolveAny.mockResolvedValueOnce([]);

		const result =
			await resolveUsingSRVRecordsOrFallbackToOtherRecords('example.com');
		expect(result).toBe('example.com:8448');
	});

	it('should throw an error if an error occurs during SRV resolution', async () => {
		mockResolver.resolveSrv = jest
			.fn()
			.mockRejectedValue(new Error('DNS resolution error'));

		await expect(
			resolveUsingSRVRecordsOrFallbackToOtherRecords('example.com'),
		).rejects.toThrow('DNS resolution error');
	});

	it('should throw an error if an error if an error occurs during ANY resolution', async () => {
		mockResolver.resolveSrv = jest.fn().mockResolvedValue([]);
		mockResolver.resolveAny.mockRejectedValueOnce(
			new Error('DNS resolution error'),
		);

		await expect(
			resolveUsingSRVRecordsOrFallbackToOtherRecords('example.com'),
		).rejects.toThrow('DNS resolution error');
	});
});

describe('#getAddressFromTargetWellKnownEndpoint()', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should return the address and maxAge from the well-known response', async () => {
		const mockResponse = {
			ok: true,
			json: jest.fn().mockResolvedValueOnce({ 'm.server': 'example.com:8448' }),
			headers: {
				get: jest.fn().mockReturnValue('max-age=3600'),
			},
		};
		global.fetch = jest.fn().mockResolvedValueOnce(mockResponse) as any;

		const result = await getAddressFromTargetWellKnownEndpoint('example.com');
		expect(result).toEqual({ address: 'example.com:8448', maxAge: 3600 });
	});

	it('should return the address with default maxAge if cache-control header is not present', async () => {
		const mockResponse = {
			ok: true,
			json: jest.fn().mockResolvedValue({ 'm.server': 'example.com:8448' }),
			headers: {
				get: jest.fn().mockReturnValue(null),
			},
		};
		global.fetch = jest.fn().mockResolvedValueOnce(mockResponse) as any;

		const result = await getAddressFromTargetWellKnownEndpoint('example.com');
		expect(result).toEqual({ address: 'example.com:8448', maxAge: 86400 });
	});

	it('should throw an error if the well-known response is not ok', async () => {
		const mockResponse = {
			ok: false,
			json: jest.fn(),
			headers: {
				get: jest.fn(),
			},
		};
		global.fetch = jest.fn().mockResolvedValueOnce(mockResponse) as any;

		await expect(
			getAddressFromTargetWellKnownEndpoint('example.com'),
		).rejects.toThrow('No address found');
	});

	it('should throw an error if json() throws', async () => {
		const mockResponse = {
			ok: true,
			json: jest.fn().mockRejectedValue(new Error('JSON error')),
			headers: {
				get: jest.fn(),
			},
		};
		global.fetch = jest.fn().mockResolvedValueOnce(mockResponse) as any;

		await expect(
			getAddressFromTargetWellKnownEndpoint('example.com'),
		).rejects.toThrow('No address found');
	});

	it('should throw an error if the well-known response does not contain m.server', async () => {
		const mockResponse = {
			ok: true,
			json: jest.fn().mockResolvedValue({}),
			headers: {
				get: jest.fn(),
			},
		};
		global.fetch = jest.fn().mockResolvedValueOnce(mockResponse) as any;

		await expect(
			getAddressFromTargetWellKnownEndpoint('example.com'),
		).rejects.toThrow('No address found');
	});

	it('should limit maxAge to 48 hours if cache-control header exceeds the limit', async () => {
		const mockResponse = {
			ok: true,
			json: jest.fn().mockResolvedValue({ 'm.server': 'example.com:8448' }),
			headers: {
				get: jest.fn().mockReturnValue('max-age=200000'),
			},
		};
		global.fetch = jest.fn().mockResolvedValueOnce(mockResponse) as any;

		const result = await getAddressFromTargetWellKnownEndpoint('example.com');
		expect(result).toEqual({ address: 'example.com:8448', maxAge: 172800 });
	});
});

describe('#getWellKnownCachedAddress()', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should return the cached address if it is still valid', () => {
		const serverName = 'example.com';
		const cachedData = {
			address: 'cached.example.com:8448',
			maxAge: 3600,
			timestamp: Date.now() - 1000, // 1 second ago
		};
		wellKnownCache.set(serverName, cachedData);

		const result = getWellKnownCachedAddress(serverName);
		expect(result).toBe('cached.example.com:8448');
	});

	it('should return null if the cached address has expired', () => {
		const serverName = 'example.com';
		const cachedData = {
			address: 'cached.example.com:8448',
			maxAge: 3600,
			timestamp: Date.now() - 4000 * 1000, // 4000 seconds ago
		};
		wellKnownCache.set(serverName, cachedData);

		const result = getWellKnownCachedAddress(serverName);
		expect(result).toBeNull();
	});

	it('should return null if there is no cached address for the server name', () => {
		const serverName = 'nonexistent.com';

		const result = getWellKnownCachedAddress(serverName);
		expect(result).toBeNull();
	});
});

describe('#resolveHostAddressByServerName()', () => {
	const localHomeServerName = 'rc1';
	const localHomeServerNameWithPort = 'rc1:443';

	afterEach(() => {
		wellKnownCache.clear();
	});

	it('should resolve IP literal addresses directly', async () => {
		const { address, headers } = await resolveHostAddressByServerName(
			'192.168.1.1',
			localHomeServerName,
		);
		expect(address).toBe('192.168.1.1:8448');
		expect(headers).toEqual({ Host: localHomeServerNameWithPort });
	});

	it('should resolve addresses with explicit ports directly', async () => {
		mockResolver.resolveAny.mockResolvedValueOnce([
			{
				type: 'AAAA',
				address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
				ttl: 300,
			},
		]);
		const { address, headers } = await resolveHostAddressByServerName(
			'example.com:8080',
			localHomeServerName,
		);
		expect(address).toBe('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:8080');
		expect(headers).toEqual({ Host: localHomeServerNameWithPort });
	});

	// TODO: Make it pass again
	it.skip('should return cached address if available and valid', async () => {
		mockResolver.resolveAny.mockResolvedValueOnce([
			{
				type: 'AAAA',
				address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
				ttl: 300,
			},
		]);
		const serverName = 'example.com';
		const cachedData = {
			address: 'cached.example.com:8448',
			maxAge: 3600,
			timestamp: Date.now() - 1000, // 1 second ago
		};
		wellKnownCache.set(serverName, cachedData);

		const { address, headers } = await resolveHostAddressByServerName(
			serverName,
			localHomeServerName,
		);
		expect(address).toBe('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:8448');
		expect(headers).toEqual({ Host: 'cached.example.com:8448' });
	});

	// TODO: Make it pass again
	it.skip('should resolve using well-known address if not cached', async () => {
		mockResolver.resolveAny.mockResolvedValueOnce([
			{
				type: 'AAAA',
				address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
				ttl: 300,
			},
		]);
		const mockResponse = {
			ok: true,
			json: jest.fn().mockResolvedValue({ 'm.server': 'example.com:8448' }),
			headers: {
				get: jest.fn().mockReturnValue('max-age=3600'),
			},
		};
		global.fetch = jest.fn().mockResolvedValueOnce(mockResponse) as any;

		const { address, headers } = await resolveHostAddressByServerName(
			'example.com',
			localHomeServerName,
		);
		expect(address).toBe('[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:8448');
		expect(headers).toEqual({ Host: 'example.com:8448' });
	});

	it('should fallback to SRV records if well-known address is not available', async () => {
		global.fetch = jest
			.fn()
			.mockRejectedValueOnce(new Error('Fetch error')) as any;
		mockResolver.resolveSrv = jest.fn().mockResolvedValue([]);
		mockResolver.resolveAny.mockResolvedValueOnce([
			{ type: 'A', address: '192.168.1.1', ttl: 300 },
		]);

		const { address, headers } = await resolveHostAddressByServerName(
			'example.com',
			localHomeServerName,
		);
		expect(address).toBe('192.168.1.1:8448');
		expect(headers).toEqual({ Host: 'example.com' });
	});

	it('should return the provided address with the default port when the request did not throw but ok is false', async () => {
		mockResolver.resolveSrv = jest.fn().mockResolvedValue([]);
		mockResolver.resolveAny.mockResolvedValueOnce([]);

		const mockResponse = {
			ok: false,
			json: jest.fn(),
			headers: {
				get: jest.fn(),
			},
		};
		global.fetch = jest.fn().mockResolvedValueOnce(mockResponse) as any;

		const { address, headers } = await resolveHostAddressByServerName(
			'example.com',
			localHomeServerName,
		);
		expect(address).toBe('example.com:8448');
		expect(headers).toEqual({ Host: 'example.com' });
	});

	it('should return the provided address with the default port when the request did not throw but json() threw', async () => {
		mockResolver.resolveSrv = jest.fn().mockResolvedValue([]);
		mockResolver.resolveAny.mockResolvedValueOnce([]);

		const mockResponse = {
			ok: true,
			json: jest.fn().mockRejectedValue(new Error('JSON error')),
			headers: {
				get: jest.fn(),
			},
		};
		global.fetch = jest.fn().mockResolvedValueOnce(mockResponse) as any;

		const { address, headers } = await resolveHostAddressByServerName(
			'example.com',
			localHomeServerName,
		);
		expect(address).toBe('example.com:8448');
		expect(headers).toEqual({ Host: 'example.com' });
	});

	it('should fallback to default port if no SRV, CNAME, AAAA, not A records are found', async () => {
		global.fetch = jest
			.fn()
			.mockRejectedValueOnce(new Error('Fetch error')) as any;
		mockResolver.resolveSrv = jest.fn().mockResolvedValue([]);
		mockResolver.resolveAny.mockResolvedValueOnce([]);

		const { address, headers } = await resolveHostAddressByServerName(
			'example.com',
			localHomeServerName,
		);
		expect(address).toBe('example.com:8448');
		expect(headers).toEqual({ Host: 'example.com' });
	});

	it('should handle errors gracefully and return address with default port', async () => {
		global.fetch = jest
			.fn()
			.mockRejectedValueOnce(new Error('Fetch error')) as any;
		mockResolver.resolveSrv = jest
			.fn()
			.mockRejectedValue(new Error('DNS resolution error'));

		const { address, headers } = await resolveHostAddressByServerName(
			'example.com',
			localHomeServerName,
		);
		expect(address).toBe('example.com:8448');
		expect(headers).toEqual({ Host: 'example.com' });
	});
});
