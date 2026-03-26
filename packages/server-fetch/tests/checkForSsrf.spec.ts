import * as ssrfModule from '../src/checkForSsrf';
import {
	allowlistedIpResolved,
	buildPinnedUrl,
	checkDirectIp,
	extractHostname,
	isIpInCidrRange,
	isIpInAnyRange,
	isIpValid,
	isValidDomain,
	normalizeAllowlistEntry,
	normalizeHostForAllowlistMatch,
	parseIpv4WithPort,
	unwrapBrackets,
	nslookup,
} from '../src/helpers';

// Mock the nslookup function
jest.mock('../src/helpers', () => ({
	...jest.requireActual('../src/helpers'),
	nslookup: jest.fn(),
}));

const nslookupMock = nslookup as jest.MockedFunction<typeof nslookup>;

describe('checkForSsrf', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('returns false if URL does not start with http:// or https://', async () => {
		expect(await ssrfModule.checkForSsrf('ftp://example.com')).toBe(false);
	});

	it('returns false if domain is invalid', async () => {
		expect(await ssrfModule.checkForSsrf('https://invalid_domain')).toBe(false);
	});

	it('returns false if IPv4 is invalid', async () => {
		expect(await ssrfModule.checkForSsrf('https://127.1')).toBe(false);
	});

	it('returns false if IPv4 is restricted', async () => {
		expect(await ssrfModule.checkForSsrf('http://127.0.0.1')).toBe(false);
	});

	it('returns false if domain is metadata.google.internal', async () => {
		expect(await ssrfModule.checkForSsrf('http://metadata.google.internal')).toBe(false);
	});

	it('returns false if DNS resolves to restricted IPv4', async () => {
		nslookupMock.mockResolvedValue('127.0.0.1');
		expect(await ssrfModule.checkForSsrf('http://example.com')).toBe(false);
	});

	it('returns true if DNS resolves to public IPv4', async () => {
		nslookupMock.mockResolvedValue('216.58.214.174');
		expect(await ssrfModule.checkForSsrf('http://example.com')).toBe(true);
	});

	it('returns true if valid public IPv4 address', async () => {
		expect(await ssrfModule.checkForSsrf('http://216.58.214.174')).toBe(true);
	});

	it('returns true if valid URL resolves to public IPv4', async () => {
		nslookupMock.mockResolvedValue('216.58.214.174');
		const url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Cat_August_2010-4.jpg/2560px-Cat_August_2010-4.jpg';
		expect(await ssrfModule.checkForSsrf(url)).toBe(true);
	});

	it('returns true for valid public IPv6 addresses', async () => {
		const publicIp = '2a00:1450:4007:806::200e';
		nslookupMock.mockResolvedValue(publicIp);
		expect(await ssrfModule.checkForSsrf('http://example.com')).toBe(true);
		expect(await ssrfModule.checkForSsrf(`[${publicIp}]`)).toBe(true);
		expect(await ssrfModule.checkForSsrf(publicIp)).toBe(true);
	});

	it('returns false if DNS resolves to restricted IPv6', async () => {
		nslookupMock.mockResolvedValue('::1');
		expect(await ssrfModule.checkForSsrf('http://example.com')).toBe(false);
	});

	it('returns true if DNS resolves to public IPv6', async () => {
		const publicIp = '2a00:1450:4007:806::200e';
		nslookupMock.mockResolvedValue(publicIp);
		expect(await ssrfModule.checkForSsrf('https://[2a00:1450:4007:806::200e]')).toBe(true);
	});

	it('returns false for invalid IPv6 format', async () => {
		expect(await ssrfModule.checkForSsrf('http://[gggg::1]')).toBe(false);
	});

	it('returns false if DNS resolution fails', async () => {
		nslookupMock.mockRejectedValue(new Error('DNS fail'));
		expect(await ssrfModule.checkForSsrf('http://example.com')).toBe(false);
	});

	it('handles bracketed and unbracketed IPv6 correctly', async () => {
		const ip = '2606:4700:4700::1111';
		expect(await ssrfModule.checkForSsrf(`[${ip}]`)).toBe(true);
		expect(await ssrfModule.checkForSsrf(ip)).toBe(true);
	});

	describe('restricted IPv6 addresses', () => {
		test.each(['::1', 'fe80::1', 'fc00::1234', 'ff02::1'])('returns false for restricted IPv6 address %s', async (ip) => {
			expect(await ssrfModule.checkForSsrf(`[${ip}]`)).toBe(false);
			expect(await ssrfModule.checkForSsrf(ip)).toBe(false);
		});
	});

	describe('allowlist (options.allowList per call)', () => {
		it('allows allowlisted private IPv4 when allowList contains it', async () => {
			expect(await ssrfModule.checkForSsrf('http://127.0.0.1', ['127.0.0.1'])).toBe(true);
		});

		it('allows allowlisted private IPv4 with port', async () => {
			expect(await ssrfModule.checkForSsrf('http://192.168.1.1:8080', ['192.168.1.1:8080'])).toBe(true);
		});

		it('allows allowlisted private IPv6', async () => {
			expect(await ssrfModule.checkForSsrf('http://[::1]', ['[::1]'])).toBe(true);
		});

		it('allows allowlisted domain that resolves to private IP', async () => {
			nslookupMock.mockResolvedValue('10.0.0.1');
			expect(await ssrfModule.checkForSsrf('http://internal.corp', ['internal.corp'])).toBe(true);
		});

		it('denies when allowList is empty or not provided', async () => {
			expect(await ssrfModule.checkForSsrf('http://127.0.0.1', ['127.0.0.1'])).toBe(true);
			expect(await ssrfModule.checkForSsrf('http://127.0.0.1', [])).toBe(false);
			expect(await ssrfModule.checkForSsrf('http://127.0.0.1')).toBe(false);
		});

		it('accepts multiple allowlist entries per call', async () => {
			const allowList = ['127.0.0.1', '192.168.1.1', '10.0.0.1'];
			expect(await ssrfModule.checkForSsrf('http://127.0.0.1', allowList)).toBe(true);
			expect(await ssrfModule.checkForSsrf('http://192.168.1.1', allowList)).toBe(true);
			expect(await ssrfModule.checkForSsrf('http://10.0.0.1', allowList)).toBe(true);
		});

		it('denies when allowList is undefined', async () => {
			expect(await ssrfModule.checkForSsrf('http://127.0.0.1')).toBe(false);
		});

		it('parses raw string (newline/comma-separated) in a single place', async () => {
			const rawSetting = '127.0.0.1\n192.168.1.1, 10.0.0.1';
			expect(await ssrfModule.checkForSsrf('http://127.0.0.1', rawSetting)).toBe(true);
			expect(await ssrfModule.checkForSsrf('http://192.168.1.1', rawSetting)).toBe(true);
			expect(await ssrfModule.checkForSsrf('http://10.0.0.1', rawSetting)).toBe(true);
		});
	});
});

describe('parseSsrfAllowlist', () => {
	it('returns empty array for empty string', () => {
		expect(ssrfModule.parseSsrfAllowlist('')).toEqual([]);
	});

	it('returns empty array for whitespace-only string', () => {
		expect(ssrfModule.parseSsrfAllowlist('   \n\t  ')).toEqual([]);
	});

	it('splits by newlines', () => {
		expect(ssrfModule.parseSsrfAllowlist('a\nb\nc')).toEqual(['a', 'b', 'c']);
	});

	it('splits by commas', () => {
		expect(ssrfModule.parseSsrfAllowlist('a,b,c')).toEqual(['a', 'b', 'c']);
	});

	it('splits by mixed newlines and commas', () => {
		expect(ssrfModule.parseSsrfAllowlist('a\nb,c\nd')).toEqual(['a', 'b', 'c', 'd']);
	});

	it('trims each entry', () => {
		expect(ssrfModule.parseSsrfAllowlist('  a  ,  b  \n  c  ')).toEqual(['a', 'b', 'c']);
	});

	it('filters out empty entries', () => {
		expect(ssrfModule.parseSsrfAllowlist('a,,b\n\nc')).toEqual(['a', 'b', 'c']);
	});

	it('returns single entry for non-empty string without separators', () => {
		expect(ssrfModule.parseSsrfAllowlist('127.0.0.1')).toEqual(['127.0.0.1']);
	});
});

describe('checkForSsrfWithIp', () => {
	it('returns allowed: false and no resolvedIp when URL is blocked', async () => {
		const result = await ssrfModule.checkForSsrfWithIp('http://127.0.0.1');
		expect(result).toEqual({ allowed: false });
	});

	it('returns allowed: true with resolvedIp for public URL', async () => {
		const result = await ssrfModule.checkForSsrfWithIp('http://216.58.214.174');
		expect(result).toEqual({ allowed: true, resolvedIp: '216.58.214.174' });
	});

	it('returns allowed: true with resolvedIp for allowlisted private IP', async () => {
		const result = await ssrfModule.checkForSsrfWithIp('http://127.0.0.1', ['127.0.0.1']);
		expect(result).toEqual({ allowed: true, resolvedIp: '127.0.0.1' });
	});
});

describe('checkForSsrfHelpers', () => {
	describe('isValidDomain', () => {
		it('returns true for valid domain', () => {
			expect(isValidDomain('example.com')).toBe(true);
			expect(isValidDomain('sub.example.com')).toBe(true);
		});
		it('returns false for invalid domain', () => {
			expect(isValidDomain('')).toBe(false);
			expect(isValidDomain('invalid_domain')).toBe(false);
			expect(isValidDomain('a')).toBe(false);
		});
	});

	describe('unwrapBrackets', () => {
		it('removes brackets from IPv6 address', () => {
			expect(unwrapBrackets('[::1]')).toBe('::1');
		});
		it('returns unchanged string when no brackets', () => {
			expect(unwrapBrackets('::1')).toBe('::1');
			expect(unwrapBrackets('example.com')).toBe('example.com');
		});
	});

	describe('isIpValid', () => {
		it('returns true for valid IPv4 and IPv6', () => {
			expect(isIpValid('127.0.0.1')).toBe(true);
			expect(isIpValid('::1')).toBe(true);
			expect(isIpValid('[::1]')).toBe(true);
		});
		it('returns false for invalid IP', () => {
			expect(isIpValid('')).toBe(false);
			expect(isIpValid('256.1.1.1')).toBe(false);
			expect(isIpValid('not-an-ip')).toBe(false);
		});
	});

	describe('isIpInCidrRange', () => {
		describe('IPv4', () => {
			it('returns true when IPv4 is in CIDR range', () => {
				expect(isIpInCidrRange('192.168.1.1', '192.168.0.0/16')).toBe(true);
				expect(isIpInCidrRange('10.0.0.1', '10.0.0.0/8')).toBe(true);
			});
			it('returns false when IPv4 is not in CIDR range', () => {
				expect(isIpInCidrRange('192.168.1.1', '10.0.0.0/8')).toBe(false);
				expect(isIpInCidrRange('8.8.8.8', '127.0.0.0/8')).toBe(false);
			});
			it('returns true for /32 exact match', () => {
				expect(isIpInCidrRange('192.168.1.1', '192.168.1.1/32')).toBe(true);
				expect(isIpInCidrRange('192.168.1.2', '192.168.1.1/32')).toBe(false);
			});
			it('treats missing prefix as /32', () => {
				expect(isIpInCidrRange('10.0.0.1', '10.0.0.1')).toBe(true);
				expect(isIpInCidrRange('10.0.0.2', '10.0.0.1')).toBe(false);
			});
			it('returns true for first and last IP in range (boundary)', () => {
				expect(isIpInCidrRange('127.0.0.0', '127.0.0.0/8')).toBe(true);
				expect(isIpInCidrRange('127.255.255.255', '127.0.0.0/8')).toBe(true);
				expect(isIpInCidrRange('128.0.0.0', '127.0.0.0/8')).toBe(false);
			});
			it('returns false when network is invalid or missing', () => {
				expect(isIpInCidrRange('192.168.1.1', '/16')).toBe(false);
			});
			it('returns false when IP version does not match CIDR (IPv4 IP with IPv6-style cidr)', () => {
				// 192.168.1.1 is IPv4; if cidr looks like IPv6 we still parse as IPv4 first - actually the cidr is split by / so "::1/128" gives network "::1" which is not valid IPv4, so net.isIP(network) !== 4 and we return false
				expect(isIpInCidrRange('192.168.1.1', '::1/128')).toBe(false);
			});
		});
		describe('IPv6', () => {
			it('returns true when IPv6 is in CIDR range', () => {
				expect(isIpInCidrRange('::1', '::1/128')).toBe(true);
				expect(isIpInCidrRange('fe80::1', 'fe80::/10')).toBe(true);
			});
			it('returns false when IPv6 is not in CIDR range', () => {
				expect(isIpInCidrRange('2a00:1450:4007:806::200e', 'fc00::/7')).toBe(false);
				expect(isIpInCidrRange('::2', '::1/128')).toBe(false);
			});
			it('accepts bracketed IPv6', () => {
				expect(isIpInCidrRange('[::1]', '::1/128')).toBe(true);
				expect(isIpInCidrRange('[fe80::1]', 'fe80::/10')).toBe(true);
			});
			it('treats missing prefix as /128', () => {
				expect(isIpInCidrRange('::1', '::1')).toBe(true);
				expect(isIpInCidrRange('::2', '::1')).toBe(false);
			});
			it('returns true for range boundaries', () => {
				expect(isIpInCidrRange('fe80::', 'fe80::/10')).toBe(true);
				expect(isIpInCidrRange('febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff', 'fe80::/10')).toBe(true);
				expect(isIpInCidrRange('fec0::1', 'fe80::/10')).toBe(false);
			});
			it('returns false when IP version does not match (IPv6 IP with IPv4 cidr)', () => {
				expect(isIpInCidrRange('::1', '127.0.0.0/8')).toBe(false);
			});
		});
		it('returns false for invalid IP', () => {
			expect(isIpInCidrRange('not-an-ip', '192.168.0.0/16')).toBe(false);
			expect(isIpInCidrRange('256.1.1.1', '192.168.0.0/16')).toBe(false);
		});
	});

	describe('isIpInAnyRange', () => {
		it('returns true for blocked IPv4 ranges', () => {
			expect(isIpInAnyRange('127.0.0.1')).toBe(true);
			expect(isIpInAnyRange('10.0.0.1')).toBe(true);
			expect(isIpInAnyRange('192.168.1.1')).toBe(true);
		});
		it('returns true for blocked IPv6 ranges', () => {
			expect(isIpInAnyRange('::1')).toBe(true);
			expect(isIpInAnyRange('fe80::1')).toBe(true);
		});
		it('returns false for public IPs', () => {
			expect(isIpInAnyRange('216.58.214.174')).toBe(false);
			expect(isIpInAnyRange('2a00:1450:4007:806::200e')).toBe(false);
		});
	});

	describe('normalizeAllowlistEntry', () => {
		it('lowercases domain', () => {
			expect(normalizeAllowlistEntry('Example.COM')).toBe('example.com');
		});
		it('keeps IPv6 with brackets as-is', () => {
			expect(normalizeAllowlistEntry('[::1]')).toBe('[::1]');
		});
		it('wraps IPv6 without brackets', () => {
			expect(normalizeAllowlistEntry('::1')).toBe('[::1]');
		});
		it('returns empty string for empty input', () => {
			expect(normalizeAllowlistEntry('')).toBe('');
			expect(normalizeAllowlistEntry('   ')).toBe('');
		});
	});

	describe('normalizeHostForAllowlistMatch', () => {
		it('keeps bracketed IPv6 as-is', () => {
			expect(normalizeHostForAllowlistMatch('[::1]')).toBe('[::1]');
		});
		it('wraps IPv6 without brackets', () => {
			expect(normalizeHostForAllowlistMatch('::1')).toBe('[::1]');
		});
		it('lowercases hostname', () => {
			expect(normalizeHostForAllowlistMatch('Example.COM')).toBe('example.com');
		});
	});

	describe('parseIpv4WithPort', () => {
		it('parses IPv4 with port', () => {
			expect(parseIpv4WithPort('192.168.1.1:8080')).toEqual({ ip: '192.168.1.1', port: '8080' });
		});
		it('parses IPv4 without port', () => {
			expect(parseIpv4WithPort('192.168.1.1')).toEqual({ ip: '192.168.1.1' });
		});
		it('returns null for invalid input', () => {
			expect(parseIpv4WithPort('not-an-ip')).toBeNull();
			expect(parseIpv4WithPort('')).toBeNull();
			expect(parseIpv4WithPort('1.2.3')).toBeNull();
		});
	});

	describe('allowlistedIpResolved', () => {
		it('returns ipOrDomain when wasUrlParsed or no port', () => {
			expect(allowlistedIpResolved('127.0.0.1', undefined, true)).toBe('127.0.0.1');
			expect(allowlistedIpResolved('127.0.0.1', undefined, false)).toBe('127.0.0.1');
		});
		it('appends port for IPv4 when not URL parsed and port present', () => {
			expect(allowlistedIpResolved('127.0.0.1', '8080', false)).toBe('127.0.0.1:8080');
		});
		it('formats IPv6 with port in brackets', () => {
			expect(allowlistedIpResolved('::1', '443', false)).toBe('[::1]:443');
		});
	});
});

describe('isIpInCidrRange (IPv4-mapped IPv6)', () => {
	it('parses IPv4-mapped address correctly so prefix > 96 works', () => {
		// ::ffff:192.168.1.1 should be in ::ffff:192.168.0.0/112 but not in ::ffff:10.0.0.0/112
		expect(isIpInCidrRange('::ffff:192.168.1.1', '::ffff:192.168.0.0/112')).toBe(true);
		expect(isIpInCidrRange('::ffff:192.168.1.1', '::ffff:10.0.0.0/112')).toBe(false);
	});
});

describe('checkDirectIp', () => {
	it('returns true for IPv4 addresses', () => {
		expect(checkDirectIp('192.168.1.1')).toBe(true);
		expect(checkDirectIp('127.0.0.1')).toBe(true);
		expect(checkDirectIp('10.0.0.1')).toBe(true);
		expect(checkDirectIp('255.255.255.255')).toBe(true);
		expect(checkDirectIp('8.8.8.8')).toBe(true);
	});

	it('returns true for IPv6 addresses with brackets', () => {
		expect(checkDirectIp('[2001:db8::1]')).toBe(true);
		expect(checkDirectIp('[::1]')).toBe(true);
		expect(checkDirectIp('[fe80::1]')).toBe(true);
		expect(checkDirectIp('[2a00:1450:4007:806::200e]')).toBe(true);
	});

	it('returns true for IPv6 addresses without brackets', () => {
		expect(checkDirectIp('2001:db8::1')).toBe(true);
		expect(checkDirectIp('::1')).toBe(true);
		expect(checkDirectIp('fe80::1')).toBe(true);
		expect(checkDirectIp('2a00:1450:4007:806::200e')).toBe(true);
	});

	it('returns false for domain names', () => {
		expect(checkDirectIp('example.com')).toBe(false);
		expect(checkDirectIp('sub.example.com')).toBe(false);
		expect(checkDirectIp('google.com')).toBe(false);
		expect(checkDirectIp('localhost')).toBe(false);
	});

	it('returns false for invalid input', () => {
		expect(checkDirectIp('')).toBe(false);
		expect(checkDirectIp('not-an-ip')).toBe(false);
		expect(checkDirectIp('http://example.com')).toBe(false);
	});

	it('returns true for patterns that look like IPs (even if invalid)', () => {
		// checkDirectIp uses a simple regex pattern match, not validation
		// It's designed to detect if something looks like an IP for DNS pinning decisions
		// So things that look like IPs but are invalid should still return true here, and then later validation will catch them as invalid
		expect(checkDirectIp('256.1.1.1')).toBe(true);
		expect(checkDirectIp('999.999.999.999')).toBe(true);
	});

	it('returns false for IPv4 with port', () => {
		expect(checkDirectIp('192.168.1.1:8080')).toBe(false);
	});

	it('returns false for IPv6 with port', () => {
		expect(checkDirectIp('[::1]:8080')).toBe(false);
	});
});

describe('extractHostname', () => {
	it('extracts hostname from http URL', () => {
		expect(extractHostname('http://example.com')).toBe('example.com');
		expect(extractHostname('http://example.com/')).toBe('example.com');
		expect(extractHostname('http://example.com/path')).toBe('example.com');
	});

	it('extracts hostname from https URL', () => {
		expect(extractHostname('https://example.com')).toBe('example.com');
		expect(extractHostname('https://sub.example.com')).toBe('sub.example.com');
	});

	it('extracts hostname with port', () => {
		expect(extractHostname('http://example.com:8080')).toBe('example.com');
		expect(extractHostname('https://example.com:443')).toBe('example.com');
	});

	it('extracts IPv4 address', () => {
		expect(extractHostname('http://192.168.1.1')).toBe('192.168.1.1');
		expect(extractHostname('http://127.0.0.1:8080')).toBe('127.0.0.1');
	});

	it('extracts and unwraps bracketed IPv6 addresses', () => {
		expect(extractHostname('http://[::1]')).toBe('::1');
		expect(extractHostname('http://[2001:db8::1]')).toBe('2001:db8::1');
		expect(extractHostname('https://[fe80::1]:8080')).toBe('fe80::1');
	});

	it('extracts hostname from URL with path and query', () => {
		expect(extractHostname('https://example.com/path/to/resource?query=value')).toBe('example.com');
		expect(extractHostname('http://example.com:3000/api/users?id=123')).toBe('example.com');
	});

	it('extracts hostname from URL with fragment', () => {
		expect(extractHostname('https://example.com/page#section')).toBe('example.com');
	});

	it('returns null for invalid URLs', () => {
		expect(extractHostname('not-a-url')).toBeNull();
		expect(extractHostname('example.com')).toBeNull();
		expect(extractHostname('')).toBeNull();
	});

	it('extracts hostname from complex URLs', () => {
		expect(extractHostname('https://user:pass@example.com:8080/path')).toBe('example.com');
		expect(extractHostname('http://subdomain.example.co.uk/path')).toBe('subdomain.example.co.uk');
	});
});

describe('buildPinnedUrl', () => {
	it('replaces hostname with IPv4 address', () => {
		expect(buildPinnedUrl('http://example.com/path', '93.184.216.34')).toBe('http://93.184.216.34/path');
		expect(buildPinnedUrl('https://example.com:443/api', '93.184.216.34')).toBe('https://93.184.216.34/api');
	});

	it('replaces hostname with IPv4 address and strips port from resolvedIp', () => {
		// When resolvedIp has port like "93.184.216.34:8080", extract just the IP
		expect(buildPinnedUrl('http://example.com/path', '93.184.216.34:8080')).toBe('http://93.184.216.34/path');
	});

	it('replaces hostname with bracketed IPv6 address', () => {
		expect(buildPinnedUrl('http://example.com/path', '2001:db8::1')).toBe('http://[2001:db8::1]/path');
		expect(buildPinnedUrl('https://example.com:443/api', 'fe80::1')).toBe('https://[fe80::1]/api');
	});

	it('replaces hostname with already-bracketed IPv6 address', () => {
		expect(buildPinnedUrl('http://example.com/path', '[2001:db8::1]')).toBe('http://[2001:db8::1]/path');
		expect(buildPinnedUrl('https://example.com/api', '[::1]')).toBe('https://[::1]/api');
	});

	it('replaces hostname with IPv6 address and strips port from resolvedIp', () => {
		// When resolvedIp has port like "[2001:db8::1]:8080", extract just the bracketed IP
		expect(buildPinnedUrl('http://example.com/path', '[2001:db8::1]:8080')).toBe('http://[2001:db8::1]/path');
		expect(buildPinnedUrl('https://example.com/api', '[::1]:443')).toBe('https://[::1]/api');
	});

	it('preserves original URL path, query, and fragment', () => {
		expect(buildPinnedUrl('http://example.com/path/to/resource?query=value#section', '93.184.216.34')).toBe(
			'http://93.184.216.34/path/to/resource?query=value#section',
		);
	});

	it('preserves original URL port', () => {
		expect(buildPinnedUrl('http://example.com:8080/path', '93.184.216.34')).toBe('http://93.184.216.34:8080/path');
		expect(buildPinnedUrl('https://example.com:9443/api', '2001:db8::1')).toBe('https://[2001:db8::1]:9443/api');
	});

	it('preserves original URL protocol', () => {
		expect(buildPinnedUrl('http://example.com/path', '93.184.216.34')).toBe('http://93.184.216.34/path');
		expect(buildPinnedUrl('https://example.com/path', '93.184.216.34')).toBe('https://93.184.216.34/path');
	});

	it('handles authentication in URL', () => {
		expect(buildPinnedUrl('http://user:pass@example.com/path', '93.184.216.34')).toBe('http://user:pass@93.184.216.34/path');
	});

	it('returns original URL when URL parsing fails', () => {
		expect(buildPinnedUrl('not-a-url', '93.184.216.34')).toBe('not-a-url');
		expect(buildPinnedUrl('', '93.184.216.34')).toBe('');
	});

	it('returns original URL for IPv4-mapped IPv6 addresses without brackets', () => {
		// ::ffff:192.168.1.1 contains both dots and colons
		// The function's condition `includes(':') && !includes('.')` is false, so it falls through to else
		// It tries to set the hostname to the raw IPv6 string without brackets, which fails
		// The try-catch returns the original URL
		expect(buildPinnedUrl('http://example.com/path', '::ffff:192.168.1.1')).toBe('http://example.com/path');
	});

	it('handles IPv4-mapped IPv6 addresses with brackets correctly', () => {
		// If the IPv4-mapped IPv6 is already bracketed, the URL API converts it to canonical form
		// 192.168.1.1 = 0xc0a80101 = c0a8:0101 in hex
		expect(buildPinnedUrl('http://example.com/path', '[::ffff:192.168.1.1]')).toBe('http://[::ffff:c0a8:101]/path');
	});
});
