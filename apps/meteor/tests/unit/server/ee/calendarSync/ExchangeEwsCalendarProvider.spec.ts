import { expect } from 'chai';
import { describe, it } from 'mocha';
import sinon from 'sinon';

import { ExchangeEwsCalendarProvider } from '../../../../../ee/server/lib/calendarSync/providers/ews/ExchangeEwsCalendarProvider';

const WINDOW = {
	start: new Date('2026-07-11T00:00:00Z'),
	end: new Date('2026-07-18T00:00:00Z'),
};

const CONFIG = {
	url: 'https://mail.example.mil/EWS/Exchange.asmx',
	username: 'CONTOSO\\svc',
	password: 'pw',
	authMethod: 'ntlm' as const,
	allowSelfSignedCerts: false,
};

const M = 'http://schemas.microsoft.com/exchange/services/2006/messages';
const T = 'http://schemas.microsoft.com/exchange/services/2006/types';

const envelope = (body: string) =>
	`<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body>${body}</s:Body></s:Envelope>`;

const findItemResponse = envelope(
	`<m:FindItemResponse xmlns:m="${M}" xmlns:t="${T}"><m:ResponseMessages>` +
		`<m:FindItemResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode><m:RootFolder><t:Items>` +
		`<t:CalendarItem><t:ItemId Id="id-1"/><t:Subject>Standup</t:Subject>` +
		`<t:Start>2026-07-12T10:00:00Z</t:Start><t:End>2026-07-12T10:30:00Z</t:End>` +
		`<t:LegacyFreeBusyStatus>Busy</t:LegacyFreeBusyStatus><t:UID>UID-1</t:UID><t:IsCancelled>false</t:IsCancelled></t:CalendarItem>` +
		`<t:CalendarItem><t:ItemId Id="id-2"/><t:Subject>Optional</t:Subject>` +
		`<t:Start>2026-07-13T10:00:00Z</t:Start><t:End>2026-07-13T11:00:00Z</t:End>` +
		`<t:LegacyFreeBusyStatus>Tentative</t:LegacyFreeBusyStatus></t:CalendarItem>` +
		`<t:CalendarItem><t:ItemId Id="id-3"/><t:Subject>Cancelled</t:Subject>` +
		`<t:Start>2026-07-14T10:00:00Z</t:Start><t:End>2026-07-14T11:00:00Z</t:End>` +
		`<t:LegacyFreeBusyStatus>Busy</t:LegacyFreeBusyStatus><t:IsCancelled>true</t:IsCancelled></t:CalendarItem>` +
		`</t:Items></m:RootFolder></m:FindItemResponseMessage></m:ResponseMessages></m:FindItemResponse>`,
);

const getItemResponse = envelope(
	`<m:GetItemResponse xmlns:m="${M}" xmlns:t="${T}"><m:ResponseMessages>` +
		`<m:GetItemResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode><m:Items>` +
		`<t:CalendarItem><t:ItemId Id="id-1"/><t:TextBody>agenda body</t:TextBody></t:CalendarItem>` +
		`</m:Items></m:GetItemResponseMessage></m:ResponseMessages></m:GetItemResponse>`,
);

const getFolderResponse = envelope(
	`<m:GetFolderResponse xmlns:m="${M}" xmlns:t="${T}"><m:ResponseMessages>` +
		`<m:GetFolderResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode>` +
		`</m:GetFolderResponseMessage></m:ResponseMessages></m:GetFolderResponse>`,
);

const noSleep = async () => undefined;

describe('calendarSync/ExchangeEwsCalendarProvider', () => {
	it('should expose EWS capabilities: no delta, no webhooks, full snapshots', async () => {
		const client = { post: sinon.stub().resolves({ statusCode: 200, headers: {}, body: findItemResponse }) };
		client.post.onSecondCall().resolves({ statusCode: 200, headers: {}, body: getItemResponse });
		const provider = new ExchangeEwsCalendarProvider(CONFIG, client, noSleep);

		expect(provider.type).to.equal('exchange-ews');
		expect(provider.supportsDelta).to.be.false;
		expect(provider.supportsWebhooks).to.be.false;

		const result = await provider.listEvents('user@example.mil', WINDOW);
		expect(result.full).to.be.true;
		expect(result.nextDeltaToken).to.be.undefined;
	});

	it('should map FindItem + GetItem results into external events', async () => {
		const client = { post: sinon.stub() };
		client.post.onFirstCall().resolves({ statusCode: 200, headers: {}, body: findItemResponse });
		client.post.onSecondCall().resolves({ statusCode: 200, headers: {}, body: getItemResponse });
		const provider = new ExchangeEwsCalendarProvider(CONFIG, client, noSleep);

		const result = await provider.listEvents('user@example.mil', WINDOW);

		expect(result.events).to.have.length(3);
		const [standup, optional, cancelled] = result.events;

		expect(standup).to.deep.include({ externalId: 'id-1', iCalUId: 'UID-1', subject: 'Standup', busy: true, description: 'agenda body' });
		expect(optional.busy).to.be.false; // Tentative is not busy
		expect(optional.description).to.equal('');
		expect(cancelled.isCancelled).to.be.true;

		// FindItem impersonates the target mailbox; GetItem only asks bodies for non-cancelled items
		expect(client.post.firstCall.args[0]).to.include('<t:PrimarySmtpAddress>user@example.mil</t:PrimarySmtpAddress>');
		expect(client.post.secondCall.args[0]).to.include('<t:ItemId Id="id-1"/>');
		expect(client.post.secondCall.args[0]).to.not.include('<t:ItemId Id="id-3"/>');
	});

	it('should skip the GetItem call when the window has no items', async () => {
		const empty = envelope(
			`<m:FindItemResponse xmlns:m="${M}" xmlns:t="${T}"><m:ResponseMessages>` +
				`<m:FindItemResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode><m:RootFolder><t:Items/></m:RootFolder>` +
				`</m:FindItemResponseMessage></m:ResponseMessages></m:FindItemResponse>`,
		);
		const client = { post: sinon.stub().resolves({ statusCode: 200, headers: {}, body: empty }) };
		const provider = new ExchangeEwsCalendarProvider(CONFIG, client, noSleep);

		const result = await provider.listEvents('user@example.mil', WINDOW);
		expect(result.events).to.be.empty;
		expect(client.post.calledOnce).to.be.true;
	});

	it('should map HTTP 401 to invalid-credentials', async () => {
		const client = { post: sinon.stub().resolves({ statusCode: 401, headers: {}, body: '' }) };
		const provider = new ExchangeEwsCalendarProvider(CONFIG, client, noSleep);

		await provider.listEvents('user@example.mil', WINDOW).then(
			() => expect.fail('expected rejection'),
			(error) => expect(error.code).to.equal('invalid-credentials'),
		);
	});

	it('should surface impersonation-denied from SOAP response codes', async () => {
		const denied = envelope(
			`<m:FindItemResponse xmlns:m="${M}"><m:ResponseMessages>` +
				`<m:FindItemResponseMessage ResponseClass="Error"><m:ResponseCode>ErrorImpersonateUserDenied</m:ResponseCode>` +
				`</m:FindItemResponseMessage></m:ResponseMessages></m:FindItemResponse>`,
		);
		const client = { post: sinon.stub().resolves({ statusCode: 500, headers: {}, body: denied }) };
		const provider = new ExchangeEwsCalendarProvider(CONFIG, client, noSleep);

		await provider.listEvents('user@example.mil', WINDOW).then(
			() => expect.fail('expected rejection'),
			(error) => expect(error.code).to.equal('impersonation-denied'),
		);
	});

	it('should retry once after HTTP 503 before giving up', async () => {
		const sleeps: number[] = [];
		const client = { post: sinon.stub() };
		client.post.onFirstCall().resolves({ statusCode: 503, headers: {}, body: '' });
		client.post.onSecondCall().resolves({ statusCode: 200, headers: {}, body: getFolderResponse });
		const provider = new ExchangeEwsCalendarProvider(CONFIG, client, async (ms) => {
			sleeps.push(ms);
		});

		const result = await provider.testConnection();
		expect(result.ok).to.be.true;
		expect(sleeps).to.have.length(1);
	});

	it('should report free/busy intervals per mailbox', async () => {
		const availability = envelope(
			`<m:GetUserAvailabilityResponse xmlns:m="${M}" xmlns:t="${T}"><m:FreeBusyResponseArray>` +
				`<m:FreeBusyResponse><m:ResponseMessage ResponseClass="Success"/><m:FreeBusyView><t:CalendarEventArray>` +
				`<t:CalendarEvent><t:StartTime>2026-07-11T14:00:00</t:StartTime><t:EndTime>2026-07-11T15:00:00</t:EndTime><t:BusyType>OOF</t:BusyType></t:CalendarEvent>` +
				`</t:CalendarEventArray></m:FreeBusyView></m:FreeBusyResponse>` +
				`</m:FreeBusyResponseArray></m:GetUserAvailabilityResponse>`,
		);
		const client = { post: sinon.stub().resolves({ statusCode: 200, headers: {}, body: availability }) };
		const provider = new ExchangeEwsCalendarProvider(CONFIG, client, noSleep);

		const results = await provider.getFreeBusy(['a@example.mil'], WINDOW);
		expect(results).to.have.length(1);
		expect(results[0].intervals[0].status).to.equal('oof');
	});

	it('should validate impersonation in testConnection when a probe mailbox is given', async () => {
		const client = { post: sinon.stub().resolves({ statusCode: 200, headers: {}, body: getFolderResponse }) };
		const provider = new ExchangeEwsCalendarProvider(CONFIG, client, noSleep);

		expect((await provider.testConnection('probe@example.mil')).ok).to.be.true;
		expect(client.post.firstCall.args[0]).to.include('<t:PrimarySmtpAddress>probe@example.mil</t:PrimarySmtpAddress>');
	});
});
