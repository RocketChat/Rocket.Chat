import fs from 'fs';
import path from 'path';

import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { ExchangeEwsCalendarProvider } from '../../../../../ee/server/lib/calendarSync/providers/ews/ExchangeEwsCalendarProvider';
import { EwsHttpClient } from '../../../../../ee/server/lib/calendarSync/providers/ews/ewsHttp';

/**
 * Air-gap requirement: with the EWS provider selected, the integration must never
 * attempt to contact any Microsoft cloud endpoint. Verified three ways:
 *  1. statically — no Microsoft-cloud hostname exists anywhere in the EWS provider
 *     sources or in the provider-agnostic sync engine;
 *  2. at the factory — selecting exchange-ews instantiates only the EWS provider
 *     (the Graph provider, which owns the cloud hostnames, is never constructed);
 *  3. at runtime — a full sync run against the EWS provider touches exactly one
 *     host: the admin-configured EWS endpoint.
 */
describe('calendarSync/air-gap (provider = exchange-ews)', () => {
	const MICROSOFT_CLOUD_PATTERNS = [/microsoftonline/i, /graph\.microsoft/i, /office365/i, /office\.com/i, /outlook\.com/i];
	const ENDPOINT = 'https://mail.airgapped.example.mil/EWS/Exchange.asmx';

	const calendarSyncRoot = path.resolve(__dirname, '../../../../../ee/server/lib/calendarSync');

	const listFiles = (dir: string): string[] =>
		fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
			const full = path.join(dir, entry.name);
			return entry.isDirectory() ? listFiles(full) : [full];
		});

	it('static: no Microsoft-cloud hostname exists in the EWS provider sources or the sync engine', () => {
		const providerAgnosticFiles = ['CalendarSyncEngine.ts', 'definition.ts', 'logSanitizer.ts', 'mailboxResolver.ts', 'startup.ts'].map(
			(file) => path.join(calendarSyncRoot, file),
		);
		const ewsFiles = listFiles(path.join(calendarSyncRoot, 'providers/ews'));

		for (const file of [...providerAgnosticFiles, ...ewsFiles]) {
			const source = fs.readFileSync(file, 'utf8');
			for (const pattern of MICROSOFT_CLOUD_PATTERNS) {
				expect(pattern.test(source), `${path.relative(calendarSyncRoot, file)} must not reference ${pattern}`).to.be.false;
			}
		}
	});

	it('factory: selecting exchange-ews never constructs the Graph provider', () => {
		const settingsValues: Record<string, unknown> = {
			CalendarSync_Provider: 'exchange-ews',
			CalendarSync_Ews_Url: ENDPOINT,
			CalendarSync_Ews_Username: 'CONTOSO\\svc',
			CalendarSync_Ews_Password: 'pw',
			CalendarSync_Ews_AuthMethod: 'ntlm',
			CalendarSync_Ews_AllowSelfSignedCerts: false,
		};

		const graphConstructor = sinon.stub();
		const serverFetchStub = sinon.stub();

		const { getConfiguredProvider } = proxyquire.noCallThru().load('../../../../../ee/server/lib/calendarSync/factory.ts', {
			'../../../../server/settings': { settings: { get: (id: string) => settingsValues[id] } },
			'@rocket.chat/server-fetch': { serverFetch: serverFetchStub },
			'./providers/graph/MicrosoftGraphCalendarProvider': {
				MicrosoftGraphCalendarProvider: class {
					constructor() {
						graphConstructor();
					}
				},
			},
		});

		const provider = getConfiguredProvider();

		expect(provider).to.be.instanceOf(ExchangeEwsCalendarProvider);
		expect(graphConstructor.called).to.be.false;
		expect(serverFetchStub.called).to.be.false;
	});

	it('runtime: a full sync run contacts only the configured EWS endpoint', async () => {
		const requestedUrls: string[] = [];

		// Synthetic NTLM Type 2 challenge so the real handshake code runs end to end
		const type2Message = (() => {
			const message = Buffer.alloc(48);
			message.write('NTLMSSP\0', 0, 'ascii');
			message.writeUInt32LE(2, 8);
			Buffer.from('0123456789abcdef', 'hex').copy(message, 24);
			return `NTLM ${message.toString('base64')}`;
		})();

		const M = 'http://schemas.microsoft.com/exchange/services/2006/messages';
		const T = 'http://schemas.microsoft.com/exchange/services/2006/types';
		const findItemResponse =
			`<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body>` +
			`<m:FindItemResponse xmlns:m="${M}" xmlns:t="${T}"><m:ResponseMessages>` +
			`<m:FindItemResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode><m:RootFolder><t:Items>` +
			`<t:CalendarItem><t:ItemId Id="id-1"/><t:Subject>Mtg</t:Subject>` +
			`<t:Start>2026-07-12T10:00:00Z</t:Start><t:End>2026-07-12T11:00:00Z</t:End>` +
			`<t:LegacyFreeBusyStatus>Busy</t:LegacyFreeBusyStatus><t:UID>UID-1</t:UID></t:CalendarItem>` +
			`</t:Items></m:RootFolder></m:FindItemResponseMessage></m:ResponseMessages></m:FindItemResponse></s:Body></s:Envelope>`;
		const getItemResponse =
			`<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body>` +
			`<m:GetItemResponse xmlns:m="${M}" xmlns:t="${T}"><m:ResponseMessages>` +
			`<m:GetItemResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode><m:Items>` +
			`<t:CalendarItem><t:ItemId Id="id-1"/><t:TextBody>body</t:TextBody></t:CalendarItem>` +
			`</m:Items></m:GetItemResponseMessage></m:ResponseMessages></m:GetItemResponse></s:Body></s:Envelope>`;

		const syncFolderItemsResponse =
			`<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body>` +
			`<m:SyncFolderItemsResponse xmlns:m="${M}"><m:ResponseMessages>` +
			`<m:SyncFolderItemsResponseMessage ResponseClass="Success"><m:ResponseCode>NoError</m:ResponseCode>` +
			`<m:SyncState>ST-1</m:SyncState><m:IncludesLastItemInRange>true</m:IncludesLastItemInRange><m:Changes/>` +
			`</m:SyncFolderItemsResponseMessage></m:ResponseMessages></m:SyncFolderItemsResponse></s:Body></s:Envelope>`;

		const recordingRequestFn = async (options: { url: string; headers: Record<string, string>; body: string }) => {
			requestedUrls.push(options.url);
			if (
				options.headers.Authorization?.startsWith('NTLM ') &&
				Buffer.from(options.headers.Authorization.slice(5), 'base64').readUInt32LE(8) === 1
			) {
				return { statusCode: 401, headers: { 'www-authenticate': type2Message }, body: '' };
			}
			if (options.body.includes('<m:SyncFolderItems>')) {
				return { statusCode: 200, headers: {}, body: syncFolderItemsResponse };
			}
			if (options.body.includes('<m:FindItem')) {
				return { statusCode: 200, headers: {}, body: findItemResponse };
			}
			return { statusCode: 200, headers: {}, body: getItemResponse };
		};

		const client = new EwsHttpClient(
			{ url: ENDPOINT, username: 'CONTOSO\\svc', password: 'pw', authMethod: 'ntlm', allowSelfSignedCerts: false },
			recordingRequestFn as any,
		);
		const provider = new ExchangeEwsCalendarProvider(
			{ url: ENDPOINT, username: 'CONTOSO\\svc', password: 'pw', authMethod: 'ntlm', allowSelfSignedCerts: false },
			client,
		);

		const importStub = sinon.stub().resolves('event-id');
		const { CalendarSyncEngine } = proxyquire.noCallThru().load('../../../../../ee/server/lib/calendarSync/CalendarSyncEngine.ts', {
			'@rocket.chat/core-services': { Calendar: { import: importStub, delete: sinon.stub().resolves({}) } },
			'@rocket.chat/models': {
				Users: { find: () => [{ _id: 'u1', emails: [{ address: 'user@airgapped.example.mil', verified: true }] }] },
				CalendarEvent: {
					findOneByExternalIdAndUserId: sinon.stub().resolves(null),
					findServerSyncedByUserIdBetweenDates: () => [],
				},
				CalendarSyncState: {
					findOneByUserId: sinon.stub().resolves(null),
					recordSuccess: sinon.stub().resolves({}),
					recordFailure: sinon.stub().resolves({}),
				},
			},
		});

		const engine = new CalendarSyncEngine(
			() => provider,
			() => ({
				mode: 'full-events',
				windowDays: 7,
				batchSize: 10,
				presenceEnabled: true,
				mailboxSource: 'email',
				mailboxCustomField: '',
				defaultLanguage: 'en',
				roles: [],
			}),
			{ debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined },
		);

		const summary = await engine.runSync();

		expect(summary?.usersProcessed).to.equal(1);
		expect(importStub.calledOnce).to.be.true;
		expect(requestedUrls.length).to.be.greaterThan(0);
		for (const url of requestedUrls) {
			expect(url).to.equal(ENDPOINT);
			for (const pattern of MICROSOFT_CLOUD_PATTERNS) {
				expect(pattern.test(url)).to.be.false;
			}
		}
	});
});
