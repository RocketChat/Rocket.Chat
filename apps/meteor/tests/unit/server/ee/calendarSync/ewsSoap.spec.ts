import { expect } from 'chai';
import { describe, it } from 'mocha';

import {
	buildFindCalendarItemsRequest,
	buildGetItemBodiesRequest,
	buildGetUserAvailabilityRequest,
	buildGetCalendarFolderRequest,
	parseAvailabilityResponse,
	parseFindItemResponse,
	parseGetItemBodiesResponse,
} from '../../../../../ee/server/lib/calendarSync/providers/ews/soap';

const WINDOW = {
	start: new Date('2026-07-11T00:00:00Z'),
	end: new Date('2026-07-18T00:00:00Z'),
};

const T = 'http://schemas.microsoft.com/exchange/services/2006/types';
const M = 'http://schemas.microsoft.com/exchange/services/2006/messages';

const envelope = (body: string) =>
	`<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body>${body}</s:Body></s:Envelope>`;

describe('calendarSync/ews/soap', () => {
	describe('request builders', () => {
		it('should set the ExchangeImpersonation header on FindItem requests', () => {
			const xml = buildFindCalendarItemsRequest('user@example.mil', WINDOW);
			expect(xml).to.include('<t:ExchangeImpersonation><t:ConnectingSID><t:PrimarySmtpAddress>user@example.mil</t:PrimarySmtpAddress>');
			expect(xml).to.include('<t:RequestServerVersion Version="Exchange2013_SP1"/>');
			expect(xml).to.include('StartDate="2026-07-11T00:00:00.000Z"');
			expect(xml).to.include('EndDate="2026-07-18T00:00:00.000Z"');
			expect(xml).to.include('<t:DistinguishedFolderId Id="calendar">');
			expect(xml).to.include('FieldURI="calendar:UID"');
			expect(xml).to.include('FieldURI="calendar:IsCancelled"');
		});

		it('should escape XML-relevant characters in the mailbox', () => {
			const xml = buildFindCalendarItemsRequest(`o'brien&x<>@example.com`, WINDOW);
			expect(xml).to.include('o&apos;brien&amp;x&lt;&gt;@example.com');
			expect(xml).to.not.include(`o'brien&x<>`);
		});

		it('should impersonate and batch item ids on GetItem body requests', () => {
			const xml = buildGetItemBodiesRequest('user@example.mil', ['AAA==', 'BBB==']);
			expect(xml).to.include('<t:PrimarySmtpAddress>user@example.mil</t:PrimarySmtpAddress>');
			expect(xml).to.include('<t:ItemId Id="AAA=="/>');
			expect(xml).to.include('<t:ItemId Id="BBB=="/>');
			expect(xml).to.include('FieldURI="item:TextBody"');
		});

		it('should request availability with a zero-bias timezone and no impersonation header', () => {
			const xml = buildGetUserAvailabilityRequest(['a@example.com', 'b@example.com'], WINDOW);
			expect(xml).to.not.include('ExchangeImpersonation');
			expect(xml).to.include('<t:Bias>0</t:Bias>');
			expect((xml.match(/<t:MailboxData>/g) ?? []).length).to.equal(2);
			expect(xml).to.include('<t:RequestedView>FreeBusy</t:RequestedView>');
		});

		it('should only impersonate on GetFolder when a probe mailbox is provided', () => {
			expect(buildGetCalendarFolderRequest()).to.not.include('ExchangeImpersonation');
			expect(buildGetCalendarFolderRequest('probe@example.com')).to.include(
				'<t:PrimarySmtpAddress>probe@example.com</t:PrimarySmtpAddress>',
			);
		});
	});

	describe('parseFindItemResponse', () => {
		it('should extract calendar items with their EWS ids, UIDs and flags', () => {
			const xml = envelope(
				`<m:FindItemResponse xmlns:m="${M}" xmlns:t="${T}"><m:ResponseMessages>` +
					`<m:FindItemResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode>` +
					`<m:RootFolder TotalItemsInView="2" IncludesLastItemInRange="true"><t:Items>` +
					`<t:CalendarItem><t:ItemId Id="id-1" ChangeKey="ck1"/><t:Subject>Standup</t:Subject>` +
					`<t:Start>2026-07-12T10:00:00Z</t:Start><t:End>2026-07-12T10:30:00Z</t:End>` +
					`<t:LegacyFreeBusyStatus>Busy</t:LegacyFreeBusyStatus><t:UID>UID-1</t:UID><t:IsCancelled>false</t:IsCancelled></t:CalendarItem>` +
					`<t:CalendarItem><t:ItemId Id="id-2" ChangeKey="ck2"/><t:Subject>Cancelled mtg</t:Subject>` +
					`<t:Start>2026-07-13T10:00:00Z</t:Start><t:End>2026-07-13T11:00:00Z</t:End>` +
					`<t:LegacyFreeBusyStatus>Free</t:LegacyFreeBusyStatus><t:IsCancelled>true</t:IsCancelled></t:CalendarItem>` +
					`</t:Items></m:RootFolder></m:FindItemResponseMessage></m:ResponseMessages></m:FindItemResponse>`,
			);

			const items = parseFindItemResponse(xml);
			expect(items).to.have.length(2);
			expect(items[0]).to.deep.include({
				itemId: 'id-1',
				subject: 'Standup',
				legacyFreeBusyStatus: 'Busy',
				uid: 'UID-1',
				isCancelled: false,
			});
			expect(items[0].start.toISOString()).to.equal('2026-07-12T10:00:00.000Z');
			expect(items[1].isCancelled).to.be.true;
			expect(items[1].uid).to.be.undefined;
		});

		it('should map ErrorImpersonateUserDenied to impersonation-denied', () => {
			const xml = envelope(
				`<m:FindItemResponse xmlns:m="${M}"><m:ResponseMessages>` +
					`<m:FindItemResponseMessage ResponseClass="Error"><m:MessageText>denied</m:MessageText>` +
					`<m:ResponseCode>ErrorImpersonateUserDenied</m:ResponseCode>` +
					`</m:FindItemResponseMessage></m:ResponseMessages></m:FindItemResponse>`,
			);

			expect(() => parseFindItemResponse(xml))
				.to.throw()
				.and.satisfy((error: any) => error.code === 'impersonation-denied');
		});

		it('should map ErrorNonExistentMailbox to mailbox-not-found', () => {
			const xml = envelope(
				`<m:FindItemResponse xmlns:m="${M}"><m:ResponseMessages>` +
					`<m:FindItemResponseMessage ResponseClass="Error"><m:ResponseCode>ErrorNonExistentMailbox</m:ResponseCode>` +
					`</m:FindItemResponseMessage></m:ResponseMessages></m:FindItemResponse>`,
			);

			expect(() => parseFindItemResponse(xml))
				.to.throw()
				.and.satisfy((error: any) => error.code === 'mailbox-not-found');
		});

		it('should map SOAP faults to provider errors', () => {
			const xml =
				`<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body>` +
				`<s:Fault><faultcode>a:ErrorSchemaValidation</faultcode><faultstring>The request failed schema validation</faultstring></s:Fault>` +
				`</s:Body></s:Envelope>`;

			expect(() => parseFindItemResponse(xml)).to.throw('schema validation');
		});
	});

	describe('SyncFolderItems', () => {
		it('should build requests with the sync state and impersonation only when present', async () => {
			const { buildSyncFolderItemsRequest } = await import('../../../../../ee/server/lib/calendarSync/providers/ews/soap');

			const initial = buildSyncFolderItemsRequest('user@example.mil');
			expect(initial).to.not.include('<m:SyncState>');
			expect(initial).to.include('<m:MaxChangesReturned>512</m:MaxChangesReturned>');
			expect(initial).to.include('<t:PrimarySmtpAddress>user@example.mil</t:PrimarySmtpAddress>');

			const incremental = buildSyncFolderItemsRequest('user@example.mil', 'STATE==');
			expect(incremental).to.include('<m:SyncState>STATE==</m:SyncState>');
		});

		it('should parse creates, updates, deletes and the new sync state', async () => {
			const { parseSyncFolderItemsResponse } = await import('../../../../../ee/server/lib/calendarSync/providers/ews/soap');
			const xml = envelope(
				`<m:SyncFolderItemsResponse xmlns:m="${M}" xmlns:t="${T}"><m:ResponseMessages>` +
					`<m:SyncFolderItemsResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode>` +
					`<m:SyncState>NEW-STATE</m:SyncState><m:IncludesLastItemInRange>false</m:IncludesLastItemInRange>` +
					`<m:Changes>` +
					`<t:Create><t:CalendarItem><t:ItemId Id="new-1"/><t:Subject>New</t:Subject>` +
					`<t:Start>2026-07-12T10:00:00Z</t:Start><t:End>2026-07-12T11:00:00Z</t:End></t:CalendarItem></t:Create>` +
					`<t:Update><t:CalendarItem><t:ItemId Id="upd-1"/><t:Subject>Moved</t:Subject>` +
					`<t:Start>2026-07-13T10:00:00Z</t:Start><t:End>2026-07-13T11:00:00Z</t:End></t:CalendarItem></t:Update>` +
					`<t:Delete><t:ItemId Id="gone-1"/></t:Delete>` +
					`</m:Changes>` +
					`</m:SyncFolderItemsResponseMessage></m:ResponseMessages></m:SyncFolderItemsResponse>`,
			);

			const result = parseSyncFolderItemsResponse(xml);
			expect(result.syncState).to.equal('NEW-STATE');
			expect(result.includesLastItemInRange).to.be.false;
			expect(result.items.map((item) => item.itemId)).to.deep.equal(['new-1', 'upd-1']);
			expect(result.deletedItemIds).to.deep.equal(['gone-1']);
		});

		it('should map ErrorInvalidSyncStateData to delta-token-expired', async () => {
			const { parseSyncFolderItemsResponse } = await import('../../../../../ee/server/lib/calendarSync/providers/ews/soap');
			const xml = envelope(
				`<m:SyncFolderItemsResponse xmlns:m="${M}"><m:ResponseMessages>` +
					`<m:SyncFolderItemsResponseMessage ResponseClass="Error"><m:ResponseCode>ErrorInvalidSyncStateData</m:ResponseCode>` +
					`</m:SyncFolderItemsResponseMessage></m:ResponseMessages></m:SyncFolderItemsResponse>`,
			);

			expect(() => parseSyncFolderItemsResponse(xml))
				.to.throw()
				.and.satisfy((error: any) => error.code === 'delta-token-expired');
		});
	});

	describe('parseGetItemBodiesResponse', () => {
		it('should map item ids to their text bodies', () => {
			const xml = envelope(
				`<m:GetItemResponse xmlns:m="${M}" xmlns:t="${T}"><m:ResponseMessages>` +
					`<m:GetItemResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode><m:Items>` +
					`<t:CalendarItem><t:ItemId Id="id-1"/><t:TextBody>join here: https://meet.example.com?callUrl=abc</t:TextBody></t:CalendarItem>` +
					`</m:Items></m:GetItemResponseMessage></m:ResponseMessages></m:GetItemResponse>`,
			);

			const bodies = parseGetItemBodiesResponse(xml);
			expect(bodies.get('id-1')).to.include('callUrl=abc');
		});
	});

	describe('parseAvailabilityResponse', () => {
		it('should return one entry per mailbox in request order, including per-mailbox errors', () => {
			const xml = envelope(
				`<m:GetUserAvailabilityResponse xmlns:m="${M}" xmlns:t="${T}"><m:FreeBusyResponseArray>` +
					`<m:FreeBusyResponse><m:ResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode></m:ResponseMessage>` +
					`<m:FreeBusyView><t:FreeBusyViewType>FreeBusy</t:FreeBusyViewType><t:CalendarEventArray>` +
					`<t:CalendarEvent><t:StartTime>2026-07-11T14:00:00</t:StartTime><t:EndTime>2026-07-11T15:00:00</t:EndTime><t:BusyType>Busy</t:BusyType></t:CalendarEvent>` +
					`<t:CalendarEvent><t:StartTime>2026-07-11T16:00:00</t:StartTime><t:EndTime>2026-07-11T17:00:00</t:EndTime><t:BusyType>Free</t:BusyType></t:CalendarEvent>` +
					`</t:CalendarEventArray></m:FreeBusyView></m:FreeBusyResponse>` +
					`<m:FreeBusyResponse><m:ResponseMessage ResponseClass="Error"><m:ResponseCode>ErrorMailRecipientNotFound</m:ResponseCode></m:ResponseMessage></m:FreeBusyResponse>` +
					`</m:FreeBusyResponseArray></m:GetUserAvailabilityResponse>`,
			);

			const results = parseAvailabilityResponse(xml);
			expect(results).to.have.length(2);
			expect(results[0].events).to.have.length(2);
			// Times without a zone suffix are UTC because the request pinned a zero-bias timezone
			expect(results[0].events[0].start.toISOString()).to.equal('2026-07-11T14:00:00.000Z');
			expect(results[1].errorCode).to.equal('ErrorMailRecipientNotFound');
		});
	});
});
