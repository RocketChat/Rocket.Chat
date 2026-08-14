import { isMcpOriginAllowed, isMcpProtocolVersionSupported, supportsMcpBatching } from './transport';
import { settings } from '../../../../server/settings/cached';

jest.mock('../../../../server/settings/cached', () => ({
	settings: { get: jest.fn() },
}));

describe('MCP HTTP transport validation', () => {
	beforeEach(() => {
		jest.mocked(settings.get).mockImplementation((setting) => {
			switch (setting) {
				case 'Site_Url':
					return 'https://chat.example.com/';
				case 'API_Enable_CORS':
					return true;
				case 'API_CORS_Origin':
					return 'https://client.example, https://other.example/path';
				default:
					return undefined;
			}
		});
	});

	it('allows non-browser, same-origin, and explicitly configured browser requests', () => {
		expect(isMcpOriginAllowed(null)).toBe(true);
		expect(isMcpOriginAllowed('https://chat.example.com')).toBe(true);
		expect(isMcpOriginAllowed('https://client.example')).toBe(true);
		expect(isMcpOriginAllowed('https://other.example')).toBe(true);
	});

	it('rejects malformed, untrusted, and wildcard-only browser origins', () => {
		expect(isMcpOriginAllowed('not-an-origin')).toBe(false);
		expect(isMcpOriginAllowed('https://attacker.example')).toBe(false);

		jest.mocked(settings.get).mockImplementation((setting) => {
			if (setting === 'Site_Url') {
				return 'https://chat.example.com';
			}
			if (setting === 'API_Enable_CORS') {
				return true;
			}
			if (setting === 'API_CORS_Origin') {
				return '*';
			}
			return undefined;
		});

		expect(isMcpOriginAllowed('https://attacker.example')).toBe(false);
	});

	it('accepts an absent or supported protocol version only', () => {
		expect(isMcpProtocolVersionSupported(null)).toBe(true);
		expect(isMcpProtocolVersionSupported('2025-11-25')).toBe(true);
		expect(isMcpProtocolVersionSupported('2099-01-01')).toBe(false);
	});

	it('only accepts JSON-RPC batches for the 2025-03-26 transport revision', () => {
		expect(supportsMcpBatching(null)).toBe(true);
		expect(supportsMcpBatching('2025-03-26')).toBe(true);
		expect(supportsMcpBatching('2025-06-18')).toBe(false);
		expect(supportsMcpBatching('2025-11-25')).toBe(false);
	});
});
