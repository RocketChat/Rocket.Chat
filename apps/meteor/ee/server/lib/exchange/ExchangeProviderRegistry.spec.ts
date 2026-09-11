import {
	detachExchangeProvider,
	getExchangeProvider,
	getSyncWindow,
	isServerSyncEnabled,
	registerExchangeProviderWatchers,
} from './ExchangeProviderRegistry';
import { settings } from '../../../../server/settings';

const watchMultiple = jest.fn();

jest.mock('../../../../server/settings', () => ({
	settings: { get: jest.fn(), watchMultiple: (...args: unknown[]) => watchMultiple(...args) },
}));

const setDays = (value: number | undefined) => jest.mocked(settings.get).mockReturnValue(value);

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const midnight = new Date('2026-08-31T00:00:00Z');

describe('getSyncWindow', () => {
	beforeEach(() => jest.clearAllMocks());

	it('starts at midnight so an event earlier today is still inside the window', () => {
		setDays(2);

		expect(getSyncWindow(new Date('2026-08-31T09:47:31.250Z'))).toEqual({
			start: midnight,
			end: new Date('2026-09-02T00:00:00Z'),
		});
	});

	it('gives every moment of one day the identical window, which is what a delta link needs', () => {
		setDays(2);

		const first = getSyncWindow(midnight);

		for (const offset of [1, HOUR, DAY - 1]) {
			expect(getSyncWindow(new Date(midnight.getTime() + offset))).toEqual(first);
		}
	});

	it('moves to the next window once the day is over', () => {
		setDays(2);

		expect(getSyncWindow(new Date(midnight.getTime() + DAY)).start).toEqual(new Date(midnight.getTime() + DAY));
	});

	it.each([
		['zero, which would sync nothing at all', 0, 2],
		['a fractional value the int field should not have allowed', 0.5, 2],
		['a negative value', -12, 1],
		['more than the hard limit of a week', 5000, 7],
	])('clamps %s', (_label, configured, expectedDays) => {
		setDays(configured);

		expect(getSyncWindow(midnight).end).toEqual(new Date(midnight.getTime() + expectedDays * DAY));
	});

	it('defaults when the setting is missing rather than producing an invalid range', () => {
		setDays(undefined);

		expect(getSyncWindow(midnight).end).toEqual(new Date(midnight.getTime() + 2 * DAY));
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

	it('detaches on a license downgrade so no credentialed provider is left behind', () => {
		configured();
		rebuild();
		expect(isServerSyncEnabled()).toBe(true);

		detachExchangeProvider();

		expect(isServerSyncEnabled()).toBe(false);
	});
});
