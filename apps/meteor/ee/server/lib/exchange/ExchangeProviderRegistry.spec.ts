import { detachExchangeProvider, getCalendarSyncWindow, getExchangeProvider, isServerSyncEnabled } from '@rocket.chat/exchange';

import { registerExchangeProviderWatchers } from './ExchangeProviderRegistry';
import { settings } from '../../../../server/settings';

const watchMultiple = jest.fn();

jest.mock('../../../../server/settings', () => ({
	settings: { get: jest.fn(), watchMultiple: (...args: unknown[]) => watchMultiple(...args) },
}));

const DAY = 24 * 60 * 60 * 1000;
const midnight = new Date('2026-08-31T00:00:00Z');

describe('sync window length', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		registerExchangeProviderWatchers();
	});

	it.each([
		['the configured length', 2, 2],
		['zero, which would sync nothing at all', 0, 2],
		['a fractional value the int field should not have allowed', 0.5, 2],
		['a negative value', -12, 1],
		['more than the hard limit of a week', 5000, 7],
	])('uses %s', (_label, configured, expectedDays) => {
		jest.mocked(settings.get).mockReturnValue(configured);

		expect(getCalendarSyncWindow(midnight).end).toEqual(new Date(midnight.getTime() + expectedDays * DAY));
	});

	it('defaults when the setting is missing rather than producing an invalid range', () => {
		jest.mocked(settings.get).mockReturnValue(undefined);

		expect(getCalendarSyncWindow(midnight).end).toEqual(new Date(midnight.getTime() + 2 * DAY));
	});
});

describe('provider selection', () => {
	const configured = (over: Record<string, unknown> = {}) => {
		const values: Record<string, unknown> = {
			Outlook_Calendar_Enabled: true,
			Exchange_Mode: 'server',
			Exchange_Sync_Provider: 'graph',
			Exchange_Graph_Tenant_Id: 'contoso',
			Exchange_Graph_Client_Id: 'client',
			Exchange_Graph_Client_Secret: 'secret',
			Exchange_EWS_Url: 'https://exchange.corp.example/EWS/Exchange.asmx',
			Exchange_EWS_Username: 'CORP\\svc',
			Exchange_EWS_Password: 'pw',
			Exchange_EWS_Auth_Method: 'ntlm',
			...over,
		};
		jest.mocked(settings.get).mockImplementation((key: string) => values[key] as string);
	};

	const rebuild = () => {
		registerExchangeProviderWatchers();
		watchMultiple.mock.calls[watchMultiple.mock.calls.length - 1][1]();
	};

	beforeEach(() => {
		jest.clearAllMocks();
		detachExchangeProvider();
	});

	it.each(['graph', 'ews'])('builds the %s provider when it is the configured type', (providerId) => {
		configured({ Exchange_Sync_Provider: providerId });

		rebuild();

		expect(getExchangeProvider().id).toBe(providerId);
	});

	it.each([
		['the integration is off', { Outlook_Calendar_Enabled: false }],
		['the mode is legacy', { Exchange_Mode: 'legacy' }],
		['the configured type is not one we implement', { Exchange_Sync_Provider: 'imap' }],
	])('builds nothing when %s', (_label, over) => {
		configured(over);

		rebuild();

		expect(isServerSyncEnabled()).toBe(false);
		expect(() => getExchangeProvider()).toThrow(expect.objectContaining({ code: 'not-configured' }));
	});
});
