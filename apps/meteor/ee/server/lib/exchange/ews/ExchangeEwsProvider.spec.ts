import { ExchangeEwsProvider } from './ExchangeEwsProvider';
import type { IEwsTransport } from './IEwsTransport';
import type { DateRange } from '../definition/types';

const T = 'http://schemas.microsoft.com/exchange/services/2006/types';
const M = 'http://schemas.microsoft.com/exchange/services/2006/messages';
const E = 'http://schemas.microsoft.com/exchange/services/2006/errors';

const soap = (body: string, prefix = 'soap') =>
	`<?xml version="1.0" encoding="utf-8"?><${prefix}:Envelope xmlns:${prefix}="http://schemas.xmlsoap.org/soap/envelope/" xmlns:t="${T}" xmlns:m="${M}"><${prefix}:Body>${body}</${prefix}:Body></${prefix}:Envelope>`;

const okResponse = (inner: string) => soap(`<m:ResponseMessages><m:ResponseCode>NoError</m:ResponseCode>${inner}</m:ResponseMessages>`);

const calendarViewOk = (...ids: string[]) =>
	okResponse(
		`<m:RootFolder><t:Items>${ids.map((id) => `<t:CalendarItem><t:ItemId Id="${id}"/></t:CalendarItem>`).join('')}</t:Items></m:RootFolder>`,
	);

// A transport that replays queued responses and records what it was asked to send.
class FakeTransport implements IEwsTransport {
	public sent: string[] = [];

	constructor(private responses: string[]) {}

	async post(soapEnvelope: string): Promise<string> {
		this.sent.push(soapEnvelope);
		const next = this.responses.shift();
		if (next === undefined) {
			throw new Error(`FakeTransport ran out of responses after ${this.sent.length} calls`);
		}
		return next;
	}
}

const timeWindow = { start: new Date('2026-08-21T00:00:00Z'), end: new Date('2026-08-22T00:00:00Z') };

const cursorFor = (syncState: string, window: DateRange = timeWindow) =>
	`${window.start.toISOString()}|${window.end.toISOString()}|${syncState}`;

const MAILBOX = 'user@corp.example';

describe('ExchangeEwsProvider', () => {
	describe('testConnection', () => {
		const SERVICE_ACCOUNT = 'svc@corp.example';

		it('resolves the service account, with no impersonation header', async () => {
			const transport = new FakeTransport([okResponse('<m:ResolutionSet TotalItemsInView="1"/>')]);

			await expect(new ExchangeEwsProvider(transport, SERVICE_ACCOUNT).testConnection()).resolves.toBeUndefined();

			expect(transport.sent[0]).toContain('<m:ResolveNames');
			expect(transport.sent[0]).toContain(SERVICE_ACCOUNT);
			expect(transport.sent[0]).not.toContain('<t:ExchangeImpersonation>');
		});

		it('treats an unresolvable name as success, because the round trip already proved the credentials', async () => {
			const transport = new FakeTransport([
				soap('<m:ResponseMessages><m:ResponseCode>ErrorNameResolutionNoResults</m:ResponseCode></m:ResponseMessages>'),
			]);

			await expect(new ExchangeEwsProvider(transport, SERVICE_ACCOUNT).testConnection()).resolves.toBeUndefined();
		});

		it('still fails on a genuine authorization problem', async () => {
			const transport = new FakeTransport([
				soap('<m:ResponseMessages><m:ResponseCode>ErrorAccessDenied</m:ResponseCode></m:ResponseMessages>'),
			]);

			await expect(new ExchangeEwsProvider(transport, SERVICE_ACCOUNT).testConnection()).rejects.toMatchObject({
				code: 'authorization-failed',
			});
		});
	});

	describe('impersonation', () => {
		it('sends an ExchangeImpersonation header naming the target mailbox', async () => {
			const transport = new FakeTransport([okResponse('<m:Changes/>')]);

			await new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow, cursorFor('S0'));

			expect(transport.sent[0]).toContain('<t:ExchangeImpersonation>');
			expect(transport.sent[0]).toContain(`<t:PrimarySmtpAddress>${MAILBOX}</t:PrimarySmtpAddress>`);
		});

		it('escapes the mailbox so a stray ampersand cannot break the envelope', async () => {
			const AMBIGUOUS_MAILBOX = 'a&b@corp.example';

			const transport = new FakeTransport([okResponse('<m:Changes/>')]);

			await new ExchangeEwsProvider(transport).listEvents(AMBIGUOUS_MAILBOX, timeWindow, cursorFor('S0'));

			expect(transport.sent[0]).toContain('a&amp;b@corp.example');
			expect(transport.sent[0]).not.toContain(AMBIGUOUS_MAILBOX);
		});

		it('pins the request server version and asks for UTC', async () => {
			const transport = new FakeTransport([okResponse('<m:Changes/>')]);

			await new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow, cursorFor('S0'));

			expect(transport.sent[0]).toContain('<t:RequestServerVersion Version="Exchange2013"/>');
			expect(transport.sent[0]).toContain('<t:TimeZoneDefinition Id="UTC"/>');
		});
	});

	describe('listEvents', () => {
		it('addresses the calendar directly, with no folder lookup of its own', async () => {
			const transport = new FakeTransport([
				okResponse('<m:SyncState>S2</m:SyncState><m:IncludesLastItemInRange>true</m:IncludesLastItemInRange><m:Changes/>'),
				okResponse('<m:SyncState>S3</m:SyncState><m:IncludesLastItemInRange>true</m:IncludesLastItemInRange><m:Changes/>'),
			]);
			const provider = new ExchangeEwsProvider(transport);

			await provider.listEvents(MAILBOX, timeWindow, cursorFor('S1'));
			await provider.listEvents(MAILBOX, timeWindow, cursorFor('S2'));

			expect(transport.sent).toHaveLength(2);
			expect(transport.sent[0]).not.toContain('<m:FindFolder');
			expect(transport.sent[0]).toContain('<m:SyncFolderId><t:DistinguishedFolderId Id="calendar"/></m:SyncFolderId>');
			expect(transport.sent[0]).toContain(`<m:SyncState>S1</m:SyncState>`);
			expect(transport.sent[1]).toContain(`<m:SyncState>S2</m:SyncState>`);
		});

		it('omits SyncState on an initial sync', async () => {
			const transport = new FakeTransport([okResponse('<m:Changes/>'), calendarViewOk()]);

			await new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow);

			expect(transport.sent[0]).not.toContain('<m:SyncState>');
		});

		it('returns the sync state as the cursor and inverts IncludesLastItemInRange', async () => {
			const transport = new FakeTransport([
				okResponse(`<m:SyncState>S1</m:SyncState><m:IncludesLastItemInRange>false</m:IncludesLastItemInRange><m:Changes/>`),
				calendarViewOk(),
			]);

			const page = await new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow);

			expect(page).toMatchObject({ cursor: cursorFor('S1'), hasMore: true });
		});

		it('takes a full window snapshot once anything changed, deletions included', async () => {
			const DELETED_ID = 'GONE';
			const SURVIVING_ID = 'STILL-THERE';

			const transport = new FakeTransport([
				okResponse(
					`<m:IncludesLastItemInRange>true</m:IncludesLastItemInRange><m:Changes><t:Delete><t:ItemId Id="${DELETED_ID}"/></t:Delete></m:Changes>`,
				),
				calendarViewOk(SURVIVING_ID),
				okResponse(
					`<m:Items><t:CalendarItem><t:ItemId Id="${SURVIVING_ID}"/><t:Start>2026-08-21T10:00:00Z</t:Start></t:CalendarItem></m:Items>`,
				),
			]);

			const page = await new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow);

			// The delete record is never surfaced: the caller removes what is absent from a complete set.
			expect(page.coverage).toBe('full');
			expect(page.items.map((event) => event?.externalId)).toEqual([SURVIVING_ID]);
		});

		it('reports nothing and skips the snapshot when the delta is empty and the window has not moved', async () => {
			const transport = new FakeTransport([
				okResponse(`<m:SyncState>S2</m:SyncState><m:IncludesLastItemInRange>true</m:IncludesLastItemInRange><m:Changes/>`),
			]);

			const page = await new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow, cursorFor('S1'));

			expect(page).toMatchObject({ items: [], cursor: cursorFor('S2'), coverage: 'delta' });
			// Just the probe. An empty delta must not cost a window fetch.
			expect(transport.sent).toHaveLength(1);
		});

		it('snapshots an empty delta anyway when the cursor was issued for another window', async () => {
			const CALENDAR_ITEM = 'ALREADY-THERE';
			const transport = new FakeTransport([
				okResponse('<m:SyncState>S1</m:SyncState><m:IncludesLastItemInRange>true</m:IncludesLastItemInRange><m:Changes/>'),
				calendarViewOk(CALENDAR_ITEM),
				okResponse(
					`<m:Items><t:CalendarItem><t:ItemId Id="${CALENDAR_ITEM}"/><t:Start>2026-08-21T10:00:00Z</t:Start></t:CalendarItem></m:Items>`,
				),
			]);

			const page = await new ExchangeEwsProvider(transport).listEvents(
				MAILBOX,
				timeWindow,
				cursorFor('S0', { start: new Date('2026-08-20T00:00:00Z'), end: new Date('2026-08-21T00:00:00Z') }),
			);

			expect(page.coverage).toBe('full');
			expect(page.items.map((event) => event?.externalId)).toEqual([CALENDAR_ITEM]);
		});

		it('fetches detail for created and updated items and normalizes them', async () => {
			const ITEM_ID = 'ITEM-1';
			const SUBJECT = 'Sprint review';
			const DESCRIPTION = 'Agenda here';
			const START = '2026-08-21T10:00:00Z';
			const END = '2026-08-21T11:00:00Z';
			const REMINDER_MINUTES = 15;

			const transport = new FakeTransport([
				okResponse(
					`<m:IncludesLastItemInRange>true</m:IncludesLastItemInRange><m:Changes><t:Create><t:CalendarItem><t:ItemId Id="${ITEM_ID}"/></t:CalendarItem></t:Create></m:Changes>`,
				),
				calendarViewOk(ITEM_ID),
				okResponse(
					'<m:Items><t:CalendarItem>' +
						`<t:ItemId Id="${ITEM_ID}"/>` +
						`<t:Subject>${SUBJECT}</t:Subject>` +
						`<t:Body BodyType="Text">${DESCRIPTION}</t:Body>` +
						`<t:Start>${START}</t:Start>` +
						`<t:End>${END}</t:End>` +
						'<t:IsCancelled>false</t:IsCancelled>' +
						'<t:LegacyFreeBusyStatus>Busy</t:LegacyFreeBusyStatus>' +
						`<t:ReminderMinutesBeforeStart>${REMINDER_MINUTES}</t:ReminderMinutesBeforeStart>` +
						'</t:CalendarItem></m:Items>',
				),
			]);

			const page = await new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow);

			expect(page.items).toEqual([
				{
					kind: 'upsert',
					externalId: ITEM_ID,
					subject: SUBJECT,
					description: DESCRIPTION,
					startTime: new Date(START),
					endTime: new Date(END),
					isCancelled: false,
					busy: true,
					reminderMinutesBeforeStart: REMINDER_MINUTES,
				},
			]);
		});

		it.each([
			['Free', false],
			['Tentative', false],
			['OOF', false],
			['Busy', true],
		])('treats LegacyFreeBusyStatus %s as busy=%s, matching the Graph provider', async (status, expected) => {
			const transport = new FakeTransport([
				okResponse(
					'<m:IncludesLastItemInRange>true</m:IncludesLastItemInRange><m:Changes><t:Create><t:CalendarItem><t:ItemId Id="I"/></t:CalendarItem></t:Create></m:Changes>',
				),
				calendarViewOk('I'),
				okResponse(
					`<m:Items><t:CalendarItem><t:ItemId Id="I"/><t:Start>2026-08-21T10:00:00Z</t:Start><t:LegacyFreeBusyStatus>${status}</t:LegacyFreeBusyStatus></t:CalendarItem></m:Items>`,
				),
			]);

			const page = await new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow);

			expect(page.items[0]).toMatchObject({ busy: expected });
		});
	});

	describe('recurring series', () => {
		const WINDOW_START = '2026-08-24T00:00:00Z';
		const WINDOW_END = '2026-08-31T00:00:00Z';

		const timeWindow = { start: new Date(WINDOW_START), end: new Date(WINDOW_END) };

		const MASTER_ID = 'MASTER-1';
		const OCCURRENCE_ID = 'OCC-1';
		const OTHER_OCCURRENCE_ID = 'OCC-2';

		const item = (id: string, start: string, type: string) =>
			`<t:CalendarItem><t:ItemId Id="${id}"/><t:Subject>Standup</t:Subject><t:Start>${start}</t:Start>` +
			`<t:End>${start}</t:End><t:CalendarItemType>${type}</t:CalendarItemType></t:CalendarItem>`;

		it('stores the expanded occurrences, never the master', async () => {
			const transport = new FakeTransport([
				okResponse(`<m:Changes><t:Update><t:ItemId Id="${MASTER_ID}"/></t:Update></m:Changes>`),
				calendarViewOk(OCCURRENCE_ID, OTHER_OCCURRENCE_ID),
				okResponse(
					`<m:Items>${item(OCCURRENCE_ID, '2026-08-24T09:00:00Z', 'Occurrence')}${item(OTHER_OCCURRENCE_ID, '2026-08-25T09:00:00Z', 'Occurrence')}</m:Items>`,
				),
			]);

			const page = await new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow);

			expect(page.items.map((event) => 'externalId' in event && event.externalId)).toEqual([OCCURRENCE_ID, OTHER_OCCURRENCE_ID]);
			expect(transport.sent[1]).toContain(`<m:CalendarView StartDate="${WINDOW_START}" EndDate="${WINDOW_END}"`);
			expect(transport.sent[1]).toContain('<t:DistinguishedFolderId Id="calendar"/>');
		});

		it('drops a master that reaches the detail fetch, since its Start is only the first occurrence', async () => {
			const transport = new FakeTransport([
				okResponse(`<m:Changes><t:Update><t:ItemId Id="${MASTER_ID}"/></t:Update></m:Changes>`),
				calendarViewOk(MASTER_ID, OCCURRENCE_ID),
				okResponse(
					`<m:Items>${item(MASTER_ID, '2026-08-24T09:00:00Z', 'RecurringMaster')}${item(OCCURRENCE_ID, '2026-08-25T09:00:00Z', 'Occurrence')}</m:Items>`,
				),
			]);

			const page = await new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow);

			expect(page.items.map((event) => 'externalId' in event && event.externalId)).toEqual([OCCURRENCE_ID]);
		});
	});

	describe('error channels', () => {
		it.each(['s', 'soap', 'SOAP-ENV'])('surfaces a SOAP fault sent with the %s prefix', async (prefix) => {
			const transport = new FakeTransport([soap(`<${prefix}:Fault><faultstring>Bad request</faultstring></${prefix}:Fault>`, prefix)]);

			await expect(new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow)).rejects.toMatchObject({
				code: 'unexpected-response',
				message: 'Exchange rejected the request',
			});
		});

		it('reads the code out of a fault detail, so an unknown mailbox is never an empty calendar', async () => {
			const transport = new FakeTransport([
				soap(
					'<s:Fault><faultstring>The specified object was not found in the store.</faultstring><detail>' +
						`<e:ResponseCode xmlns:e="${E}">ErrorNonExistentMailbox</e:ResponseCode>` +
						'</detail></s:Fault>',
					's',
				),
			]);

			await expect(new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow)).rejects.toMatchObject({
				code: 'mailbox-not-found',
			});
		});

		it.each([
			['ErrorAccessDenied', 'authorization-failed'],
			['ErrorImpersonateUserDenied', 'authorization-failed'],
			['ErrorNonExistentMailbox', 'mailbox-not-found'],
			['ErrorInvalidSyncStateData', 'sync-state-invalid'],
		])('maps the per-item ResponseCode %s to %s', async (responseCode, code) => {
			const transport = new FakeTransport([
				soap(`<m:ResponseMessages><m:ResponseCode>${responseCode}</m:ResponseCode></m:ResponseMessages>`),
			]);

			await expect(new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow)).rejects.toMatchObject({ code });
		});

		it('rejects a proxy error page instead of reading it as an empty calendar', async () => {
			// Well formed HTML parses as XML and matches nothing, so without the envelope guard this reads as an empty calendar.
			const transport = new FakeTransport(['<html><body>502 Bad Gateway</body></html>']);

			await expect(new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow)).rejects.toMatchObject({
				code: 'unexpected-response',
				message: 'Exchange returned a document that is not a SOAP envelope',
			});
		});

		it('rejects an Envelope that is not in a SOAP namespace', async () => {
			const transport = new FakeTransport(['<Envelope xmlns="urn:acme:portal"><Body/></Envelope>']);

			await expect(new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow)).rejects.toMatchObject({
				code: 'unexpected-response',
				message: 'Exchange returned a document that is not a SOAP envelope',
			});
		});

		it('rejects a body that is not XML at all', async () => {
			const transport = new FakeTransport(['502 Bad Gateway']);

			await expect(new ExchangeEwsProvider(transport).listEvents(MAILBOX, timeWindow)).rejects.toMatchObject({
				code: 'unexpected-response',
				message: 'Exchange returned a body that is not valid XML',
			});
		});
	});
});
