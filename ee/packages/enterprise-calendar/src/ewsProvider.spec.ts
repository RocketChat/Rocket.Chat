import { ExchangeEwsProviderBoundary, validateEwsConfiguration } from './ewsProvider';

const configuration = {
	endpoint: 'https://exchange.example.com/EWS/Exchange.asmx',
	authentication: { type: 'negotiate' as const },
	impersonation: true as const,
	exchangeVersion: 'ExchangeSE' as const,
};

describe('EWS provider boundary', () => {
	it('does not claim operational EWS support', async () => {
		expect(validateEwsConfiguration(configuration)).toMatchObject({ valid: false, code: 'ews-not-implemented' });
		const provider = new ExchangeEwsProviderBoundary(configuration);
		await expect(
			provider.getCalendarWindow({ provider: 'exchange-ews', address: 'u@example.com' }, new Date(), new Date()),
		).rejects.toMatchObject({
			category: 'unsupported',
		});
	});

	it('rejects non-TLS and credential-bearing endpoints before network use', () => {
		expect(validateEwsConfiguration({ ...configuration, endpoint: 'http://user:pass@example.com/EWS' })).toMatchObject({
			valid: false,
			code: 'invalid-ews-url',
		});
	});
});
