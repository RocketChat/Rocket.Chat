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
};

const M = 'http://schemas.microsoft.com/exchange/services/2006/messages';
const T = 'http://schemas.microsoft.com/exchange/services/2006/types';

const envelope = (body: string) =>
	`<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body>${body}</s:Body></s:Envelope>`;

const itemXml = ({
	id,
	subject = `Meeting ${id}`,
	start = '2026-07-12T10:00:00Z',
	end = '2026-07-12T11:00:00Z',
	status = 'Busy',
	uid = `UID-${id}`,
	cancelled = false,
}: {
	id: string;
	subject?: string;
	start?: string;
	end?: string;
	status?: string;
	uid?: string;
	cancelled?: boolean;
}) =>
	`<t:CalendarItem><t:ItemId Id="${id}"/><t:Subject>${subject}</t:Subject>` +
	`<t:Start>${start}</t:Start><t:End>${end}</t:End>` +
	`<t:LegacyFreeBusyStatus>${status}</t:LegacyFreeBusyStatus><t:UID>${uid}</t:UID>` +
	`<t:IsCancelled>${cancelled}</t:IsCancelled></t:CalendarItem>`;

const findItemResponse = (items: string[]) =>
	envelope(
		`<m:FindItemResponse xmlns:m="${M}" xmlns:t="${T}"><m:ResponseMessages>` +
			`<m:FindItemResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode>` +
			`<m:RootFolder><t:Items>${items.join('')}</t:Items></m:RootFolder>` +
			`</m:FindItemResponseMessage></m:ResponseMessages></m:FindItemResponse>`,
	);

const getItemResponse = (bodies: [string, string][]) =>
	envelope(
		`<m:GetItemResponse xmlns:m="${M}" xmlns:t="${T}"><m:ResponseMessages>` +
			`<m:GetItemResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode><m:Items>${bodies
				.map(([id, body]) => `<t:CalendarItem><t:ItemId Id="${id}"/><t:TextBody>${body}</t:TextBody></t:CalendarItem>`)
				.join('')}</m:Items></m:GetItemResponseMessage></m:ResponseMessages></m:GetItemResponse>`,
	);

const syncResponse = ({
	state,
	last = true,
	creates = [],
	deletes = [],
}: {
	state: string;
	last?: boolean;
	creates?: string[];
	deletes?: string[];
}) =>
	envelope(
		`<m:SyncFolderItemsResponse xmlns:m="${M}" xmlns:t="${T}"><m:ResponseMessages>` +
			`<m:SyncFolderItemsResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode>` +
			`<m:SyncState>${state}</m:SyncState><m:IncludesLastItemInRange>${last}</m:IncludesLastItemInRange>` +
			`<m:Changes>${creates.map((item) => `<t:Create>${item}</t:Create>`).join('')}${deletes
				.map((id) => `<t:Delete><t:ItemId Id="${id}"/></t:Delete>`)
				.join('')}</m:Changes>` +
			`</m:SyncFolderItemsResponseMessage></m:ResponseMessages></m:SyncFolderItemsResponse>`,
	);

const syncStateErrorResponse = envelope(
	`<m:SyncFolderItemsResponse xmlns:m="${M}"><m:ResponseMessages>` +
		`<m:SyncFolderItemsResponseMessage ResponseClass="Error"><m:ResponseCode>ErrorInvalidSyncStateData</m:ResponseCode>` +
		`</m:SyncFolderItemsResponseMessage></m:ResponseMessages></m:SyncFolderItemsResponse>`,
);

const getFolderResponse = envelope(
	`<m:GetFolderResponse xmlns:m="${M}" xmlns:t="${T}"><m:ResponseMessages>` +
		`<m:GetFolderResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode>` +
		`</m:GetFolderResponseMessage></m:ResponseMessages></m:GetFolderResponse>`,
);

/** Routes stubbed responses by SOAP operation; records request bodies per operation */
const routedClient = (routes: {
	sync?: (call: number) => string;
	find?: string;
	getItem?: string;
	availability?: string;
	getFolder?: string;
}) => {
	const requests: Record<string, string[]> = { sync: [], find: [], getItem: [], availability: [], getFolder: [] };
	let syncCalls = 0;
	const post = sinon.stub().callsFake(async (soapXml: string) => {
		const respond = (body?: string): { statusCode: number; headers: Record<string, never>; body: string } => {
			if (body === undefined) {
				throw new Error(`Unexpected SOAP operation in test: ${soapXml.slice(0, 400)}`);
			}
			return { statusCode: 200, headers: {}, body };
		};

		if (soapXml.includes('<m:SyncFolderItems>')) {
			requests.sync.push(soapXml);
			return respond(routes.sync?.(syncCalls++));
		}
		if (soapXml.includes('<m:FindItem')) {
			requests.find.push(soapXml);
			return respond(routes.find);
		}
		if (soapXml.includes('<m:GetItem>')) {
			requests.getItem.push(soapXml);
			return respond(routes.getItem);
		}
		if (soapXml.includes('<m:GetUserAvailabilityRequest>')) {
			requests.availability.push(soapXml);
			return respond(routes.availability);
		}
		if (soapXml.includes('<m:GetFolder>')) {
			requests.getFolder.push(soapXml);
			return respond(routes.getFolder);
		}
		throw new Error('Unknown SOAP operation');
	});
	return { post, requests };
};

const noSleep = async () => undefined;

describe('calendarSync/ExchangeEwsCalendarProvider', () => {
	it('should support incremental sync but not webhooks', () => {
		const provider = new ExchangeEwsCalendarProvider(CONFIG, { post: sinon.stub() }, noSleep);
		expect(provider.type).to.equal('exchange-ews');
		expect(provider.supportsDelta).to.be.true;
		expect(provider.supportsWebhooks).to.be.false;
	});

	describe('full snapshot (no sync state)', () => {
		it('should establish the SyncState before the snapshot and map FindItem + GetItem results', async () => {
			const client = routedClient({
				sync: () => syncResponse({ state: 'ST-1' }),
				find: findItemResponse([
					itemXml({ id: 'id-1' }),
					itemXml({ id: 'id-2', status: 'Tentative', start: '2026-07-13T10:00:00Z', end: '2026-07-13T11:00:00Z' }),
					itemXml({ id: 'id-3', cancelled: true, start: '2026-07-14T10:00:00Z', end: '2026-07-14T11:00:00Z' }),
				]),
				getItem: getItemResponse([['id-1', 'agenda body']]),
			});
			const provider = new ExchangeEwsCalendarProvider(CONFIG, client, noSleep);

			const result = await provider.listEvents('user@example.mil', WINDOW);

			expect(result.full).to.be.true;
			expect(result.nextDeltaToken).to.equal('ST-1');
			expect(result.events).to.have.length(3);

			const [standup, optional, cancelled] = result.events;
			expect(standup).to.deep.include({ externalId: 'id-1', iCalUId: 'UID-id-1', busy: true, description: 'agenda body' });
			expect(optional.busy).to.be.false; // Tentative is not busy
			expect(cancelled.isCancelled).to.be.true;

			// SyncState established first; impersonation on every mailbox-scoped call;
			// GetItem asks bodies only for non-cancelled items
			expect(client.post.firstCall.args[0]).to.include('<m:SyncFolderItems>');
			expect(client.requests.find[0]).to.include('<t:PrimarySmtpAddress>user@example.mil</t:PrimarySmtpAddress>');
			expect(client.requests.getItem[0]).to.include('<t:ItemId Id="id-1"/>');
			expect(client.requests.getItem[0]).to.not.include('<t:ItemId Id="id-3"/>');
		});

		it('should return no delta token when the mailbox cannot be fast-forwarded within the page cap', async () => {
			const client = routedClient({
				sync: (call) => syncResponse({ state: `ST-${call}`, last: false }),
				find: findItemResponse([]),
			});
			const provider = new ExchangeEwsCalendarProvider(CONFIG, client, noSleep);

			const result = await provider.listEvents('user@example.mil', WINDOW);

			expect(result.full).to.be.true;
			expect(result.nextDeltaToken).to.be.undefined;
			expect(client.requests.sync).to.have.length(20);
			expect(client.requests.getItem).to.be.empty; // no items → no GetItem call
		});
	});

	describe('incremental sync (with sync state)', () => {
		it('should page through changes, filter to the window, and surface deletions', async () => {
			const client = routedClient({
				sync: (call) =>
					call === 0
						? syncResponse({
								state: 'ST-2',
								last: false,
								creates: [itemXml({ id: 'in-window' })],
								deletes: ['gone-1'],
							})
						: syncResponse({
								state: 'ST-3',
								last: true,
								creates: [itemXml({ id: 'out-of-window', start: '2026-09-01T10:00:00Z', end: '2026-09-01T11:00:00Z' })],
							}),
				getItem: getItemResponse([['in-window', 'body']]),
			});
			const provider = new ExchangeEwsCalendarProvider(CONFIG, client, noSleep);

			const result = await provider.listEvents('user@example.mil', WINDOW, 'ST-1');

			expect(result.full).to.be.false;
			expect(result.nextDeltaToken).to.equal('ST-3');
			expect(result.events.map((event) => event.externalId)).to.deep.equal(['in-window']);
			// explicit Delete change + item rescheduled out of the window
			expect(result.deletedEventIds).to.deep.equal(['gone-1', 'out-of-window']);

			expect(client.requests.sync[0]).to.include('<m:SyncState>ST-1</m:SyncState>');
			expect(client.requests.sync[1]).to.include('<m:SyncState>ST-2</m:SyncState>');
			expect(client.requests.find).to.be.empty;
		});

		it('should fall back to a full snapshot when the sync state is rejected', async () => {
			let firstSyncCall = true;
			const client = routedClient({
				sync: () => {
					if (firstSyncCall) {
						firstSyncCall = false;
						return syncStateErrorResponse;
					}
					return syncResponse({ state: 'ST-fresh' });
				},
				find: findItemResponse([itemXml({ id: 'id-1' })]),
				getItem: getItemResponse([['id-1', 'body']]),
			});
			const provider = new ExchangeEwsCalendarProvider(CONFIG, client, noSleep);

			const result = await provider.listEvents('user@example.mil', WINDOW, 'stale-state');

			expect(result.full).to.be.true;
			expect(result.nextDeltaToken).to.equal('ST-fresh');
			expect(result.events).to.have.length(1);
		});
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
			`<m:SyncFolderItemsResponse xmlns:m="${M}"><m:ResponseMessages>` +
				`<m:SyncFolderItemsResponseMessage ResponseClass="Error"><m:ResponseCode>ErrorImpersonateUserDenied</m:ResponseCode>` +
				`</m:SyncFolderItemsResponseMessage></m:ResponseMessages></m:SyncFolderItemsResponse>`,
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
		const client = routedClient({ availability });
		const provider = new ExchangeEwsCalendarProvider(CONFIG, client, noSleep);

		const results = await provider.getFreeBusy(['a@example.mil'], WINDOW);
		expect(results).to.have.length(1);
		expect(results[0].intervals[0].status).to.equal('oof');
	});

	it('should validate impersonation in testConnection when a probe mailbox is given', async () => {
		const client = routedClient({ getFolder: getFolderResponse });
		const provider = new ExchangeEwsCalendarProvider(CONFIG, client, noSleep);

		expect((await provider.testConnection('probe@example.mil')).ok).to.be.true;
		expect(client.requests.getFolder[0]).to.include('<t:PrimarySmtpAddress>probe@example.mil</t:PrimarySmtpAddress>');
	});
});
