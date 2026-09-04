import { ExchangeEwsProvider, parseEwsDateTime } from './ExchangeEwsProvider';
import type { IEwsTransport } from './IEwsTransport';

const T = 'http://schemas.microsoft.com/exchange/services/2006/types';
const M = 'http://schemas.microsoft.com/exchange/services/2006/messages';

const soap = (body: string) =>
	`<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:t="${T}" xmlns:m="${M}"><soap:Body>${body}</soap:Body></soap:Envelope>`;

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

describe('parseEwsDateTime', () => {
	it('parses the EWS UTC format', () => {
		expect(parseEwsDateTime('2026-08-21T10:00:00Z')?.toISOString()).toBe('2026-08-21T10:00:00.000Z');
	});

	it('respects an explicit offset when one is present', () => {
		expect(parseEwsDateTime('2026-08-21T10:00:00+02:00')?.toISOString()).toBe('2026-08-21T08:00:00.000Z');
	});

	it('returns undefined rather than epoch for junk', () => {
		expect(parseEwsDateTime('nonsense')).toBeUndefined();
		expect(parseEwsDateTime(undefined)).toBeUndefined();
	});
});

describe('ExchangeEwsProvider', () => {
	describe('testConnection', () => {
		it('resolves the service account, with no impersonation header', async () => {
			const transport = new FakeTransport([okResponse('<m:ResolutionSet TotalItemsInView="1"/>')]);

			await expect(new ExchangeEwsProvider(transport, 'svc@corp.example').testConnection()).resolves.toBeUndefined();

			expect(transport.sent[0]).toContain('<m:ResolveNames');
			expect(transport.sent[0]).toContain('svc@corp.example');
			expect(transport.sent[0]).not.toContain('<t:ExchangeImpersonation>');
		});

		it('treats an unresolvable name as success, because the round trip already proved the credentials', async () => {
			const transport = new FakeTransport([
				soap('<m:ResponseMessages><m:ResponseCode>ErrorNameResolutionNoResults</m:ResponseCode></m:ResponseMessages>'),
			]);

			await expect(new ExchangeEwsProvider(transport, 'svc@corp.example').testConnection()).resolves.toBeUndefined();
		});

		it('still fails on a genuine authorization problem', async () => {
			const transport = new FakeTransport([
				soap('<m:ResponseMessages><m:ResponseCode>ErrorAccessDenied</m:ResponseCode></m:ResponseMessages>'),
			]);

			await expect(new ExchangeEwsProvider(transport, 'svc@corp.example').testConnection()).rejects.toMatchObject({
				code: 'authorization-failed',
			});
		});
	});

	describe('impersonation', () => {
		it('sends an ExchangeImpersonation header naming the target mailbox', async () => {
			const transport = new FakeTransport([okResponse('<m:Changes/>')]);

			await new ExchangeEwsProvider(transport).listEvents('user@corp.example', timeWindow);

			expect(transport.sent[0]).toContain('<t:ExchangeImpersonation>');
			expect(transport.sent[0]).toContain('<t:PrimarySmtpAddress>user@corp.example</t:PrimarySmtpAddress>');
		});

		it('escapes the mailbox so a stray ampersand cannot break the envelope', async () => {
			const transport = new FakeTransport([okResponse('<m:Changes/>')]);

			await new ExchangeEwsProvider(transport).listEvents('a&b@corp.example', timeWindow);

			expect(transport.sent[0]).toContain('a&amp;b@corp.example');
			expect(transport.sent[0]).not.toContain('a&b@corp.example');
		});

		it('pins the request server version and asks for UTC', async () => {
			const transport = new FakeTransport([okResponse('<m:Changes/>')]);

			await new ExchangeEwsProvider(transport).listEvents('user@corp.example', timeWindow);

			expect(transport.sent[0]).toContain('<t:RequestServerVersion Version="Exchange2013"/>');
			expect(transport.sent[0]).toContain('<t:TimeZoneDefinition Id="UTC"/>');
		});
	});

	describe('listEvents', () => {
		it('addresses the calendar directly, with no folder lookup of its own', async () => {
			const transport = new FakeTransport([
				okResponse('<m:SyncState>S1</m:SyncState><m:IncludesLastItemInRange>true</m:IncludesLastItemInRange><m:Changes/>'),
				okResponse('<m:SyncState>S2</m:SyncState><m:IncludesLastItemInRange>true</m:IncludesLastItemInRange><m:Changes/>'),
			]);
			const provider = new ExchangeEwsProvider(transport);

			await provider.listEvents('user@corp.example', timeWindow);
			await provider.listEvents('user@corp.example', timeWindow, 'S1');

			expect(transport.sent).toHaveLength(2);
			expect(transport.sent[0]).not.toContain('<m:FindFolder');
			expect(transport.sent[0]).toContain('<m:SyncFolderId><t:DistinguishedFolderId Id="calendar"/></m:SyncFolderId>');
			expect(transport.sent[1]).toContain('<m:SyncState>S1</m:SyncState>');
		});

		it('omits SyncState on an initial sync', async () => {
			const transport = new FakeTransport([okResponse('<m:Changes/>')]);

			await new ExchangeEwsProvider(transport).listEvents('user@corp.example', timeWindow);

			expect(transport.sent[0]).not.toContain('<m:SyncState>');
		});

		it('returns the sync state as the cursor and inverts IncludesLastItemInRange', async () => {
			const transport = new FakeTransport([
				okResponse('<m:SyncState>TOKEN</m:SyncState><m:IncludesLastItemInRange>false</m:IncludesLastItemInRange><m:Changes/>'),
			]);

			const page = await new ExchangeEwsProvider(transport).listEvents('user@corp.example', timeWindow);

			expect(page).toMatchObject({ cursor: 'TOKEN', hasMore: true });
		});

		it('takes a full window snapshot once anything changed, deletions included', async () => {
			const transport = new FakeTransport([
				okResponse(
					'<m:IncludesLastItemInRange>true</m:IncludesLastItemInRange><m:Changes><t:Delete><t:ItemId Id="GONE"/></t:Delete></m:Changes>',
				),
				calendarViewOk('STILL-THERE'),
				okResponse(
					'<m:Items><t:CalendarItem><t:ItemId Id="STILL-THERE"/><t:Start>2026-08-21T10:00:00Z</t:Start></t:CalendarItem></m:Items>',
				),
			]);

			const page = await new ExchangeEwsProvider(transport).listEvents('user@corp.example', timeWindow);

			// The delete record is never surfaced: the caller removes what is absent from a complete set.
			expect(page.isCompleteForWindow).toBe(true);
			expect(page.items.map((event) => event?.externalId)).toEqual(['STILL-THERE']);
		});

		it('reports nothing and skips the snapshot when the delta is empty', async () => {
			const transport = new FakeTransport([
				okResponse('<m:SyncState>S1</m:SyncState><m:IncludesLastItemInRange>true</m:IncludesLastItemInRange><m:Changes/>'),
			]);

			const page = await new ExchangeEwsProvider(transport).listEvents('user@corp.example', timeWindow);

			expect(page).toMatchObject({ items: [], cursor: 'S1', isCompleteForWindow: false });
			// Just the probe. An empty delta must not cost a window fetch.
			expect(transport.sent).toHaveLength(1);
		});

		it('fetches detail for created and updated items and normalizes them', async () => {
			const transport = new FakeTransport([
				okResponse(
					'<m:IncludesLastItemInRange>true</m:IncludesLastItemInRange><m:Changes><t:Create><t:CalendarItem><t:ItemId Id="ITEM-1"/></t:CalendarItem></t:Create></m:Changes>',
				),
				calendarViewOk('ITEM-1'),
				okResponse(
					'<m:Items><t:CalendarItem>' +
						'<t:ItemId Id="ITEM-1"/>' +
						'<t:Subject>Sprint review</t:Subject>' +
						'<t:Body BodyType="Text">Agenda here</t:Body>' +
						'<t:UID>040000008200E0</t:UID>' +
						'<t:Start>2026-08-21T10:00:00Z</t:Start>' +
						'<t:End>2026-08-21T11:00:00Z</t:End>' +
						'<t:IsAllDayEvent>false</t:IsAllDayEvent>' +
						'<t:IsCancelled>false</t:IsCancelled>' +
						'<t:LegacyFreeBusyStatus>Busy</t:LegacyFreeBusyStatus>' +
						'<t:ReminderMinutesBeforeStart>15</t:ReminderMinutesBeforeStart>' +
						'</t:CalendarItem></m:Items>',
				),
			]);

			const page = await new ExchangeEwsProvider(transport).listEvents('user@corp.example', timeWindow);

			expect(page.items).toEqual([
				{
					kind: 'upsert',
					externalId: 'ITEM-1',
					iCalUId: '040000008200E0',
					subject: 'Sprint review',
					description: 'Agenda here',
					startTime: new Date('2026-08-21T10:00:00Z'),
					endTime: new Date('2026-08-21T11:00:00Z'),
					isAllDay: false,
					isCancelled: false,
					busy: true,
					reminderMinutesBeforeStart: 15,
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

			const page = await new ExchangeEwsProvider(transport).listEvents('user@corp.example', timeWindow);

			expect(page.items[0]).toMatchObject({ busy: expected });
		});
	});

	describe('recurring series', () => {
		const timeWindow = { start: new Date('2026-08-24T00:00:00Z'), end: new Date('2026-08-31T00:00:00Z') };

		const item = (id: string, start: string, type: string) =>
			`<t:CalendarItem><t:ItemId Id="${id}"/><t:Subject>Standup</t:Subject><t:Start>${start}</t:Start>` +
			`<t:End>${start}</t:End><t:CalendarItemType>${type}</t:CalendarItemType></t:CalendarItem>`;

		it('stores the expanded occurrences, never the master', async () => {
			const transport = new FakeTransport([
				okResponse('<m:Changes><t:Update><t:ItemId Id="MASTER-1"/></t:Update></m:Changes>'),
				calendarViewOk('OCC-1', 'OCC-2'),
				okResponse(
					`<m:Items>${item('OCC-1', '2026-08-24T09:00:00Z', 'Occurrence')}${item('OCC-2', '2026-08-25T09:00:00Z', 'Occurrence')}</m:Items>`,
				),
			]);

			const page = await new ExchangeEwsProvider(transport).listEvents('user@corp.example', timeWindow);

			expect(page.items.map((event) => 'externalId' in event && event.externalId)).toEqual(['OCC-1', 'OCC-2']);
			expect(transport.sent[1]).toContain('<m:CalendarView StartDate="2026-08-24T00:00:00Z" EndDate="2026-08-31T00:00:00Z"');
			expect(transport.sent[1]).toContain('<t:DistinguishedFolderId Id="calendar"/>');
		});

		it('drops a master that reaches the detail fetch, since its Start is only the first occurrence', async () => {
			const transport = new FakeTransport([
				okResponse('<m:Changes><t:Update><t:ItemId Id="MASTER-1"/></t:Update></m:Changes>'),
				calendarViewOk('MASTER-1', 'OCC-1'),
				okResponse(
					`<m:Items>${item('MASTER-1', '2026-08-24T09:00:00Z', 'RecurringMaster')}${item('OCC-1', '2026-08-25T09:00:00Z', 'Occurrence')}</m:Items>`,
				),
			]);

			const page = await new ExchangeEwsProvider(transport).listEvents('user@corp.example', timeWindow);

			expect(page.items.map((event) => 'externalId' in event && event.externalId)).toEqual(['OCC-1']);
		});
	});

	describe('error channels', () => {
		it('surfaces a SOAP fault', async () => {
			const transport = new FakeTransport([soap('<soap:Fault><faultstring>Bad request</faultstring></soap:Fault>')]);

			await expect(new ExchangeEwsProvider(transport).listEvents('user@corp.example', timeWindow)).rejects.toMatchObject({
				code: 'unexpected-response',
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

			await expect(new ExchangeEwsProvider(transport).listEvents('user@corp.example', timeWindow)).rejects.toMatchObject({ code });
		});

		it('rejects a proxy error page instead of reading it as an empty calendar', async () => {
			// Well formed HTML parses as XML and matches nothing, so without the envelope guard this reads as an empty calendar.
			const transport = new FakeTransport(['<html><body>502 Bad Gateway</body></html>']);

			await expect(new ExchangeEwsProvider(transport).listEvents('user@corp.example', timeWindow)).rejects.toMatchObject({
				code: 'unexpected-response',
			});
		});

		it('rejects a body that is not XML at all', async () => {
			const transport = new FakeTransport(['502 Bad Gateway']);

			await expect(new ExchangeEwsProvider(transport).listEvents('user@corp.example', timeWindow)).rejects.toMatchObject({
				code: 'unexpected-response',
			});
		});
	});
});
