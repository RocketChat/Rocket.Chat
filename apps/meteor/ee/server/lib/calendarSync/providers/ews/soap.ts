import { DOMParser } from '@xmldom/xmldom';

import { CalendarSyncError } from '../../definition';
import type { ICalendarSyncWindow } from '../../definition';

export const EWS_TYPES_NS = 'http://schemas.microsoft.com/exchange/services/2006/types';
export const EWS_MESSAGES_NS = 'http://schemas.microsoft.com/exchange/services/2006/messages';
const SOAP_NS = 'http://schemas.xmlsoap.org/soap/envelope/';

export function escapeXml(value: string): string {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/**
 * Wraps an EWS operation in a SOAP envelope. When `impersonatedMailbox` is set,
 * the ExchangeImpersonation header instructs Exchange to run the operation as
 * that mailbox (requires the ApplicationImpersonation RBAC role).
 */
export function soapEnvelope(body: string, impersonatedMailbox?: string): string {
	const impersonation = impersonatedMailbox
		? `<t:ExchangeImpersonation><t:ConnectingSID><t:PrimarySmtpAddress>${escapeXml(
				impersonatedMailbox,
			)}</t:PrimarySmtpAddress></t:ConnectingSID></t:ExchangeImpersonation>`
		: '';

	return (
		`<?xml version="1.0" encoding="utf-8"?>` +
		`<soap:Envelope xmlns:soap="${SOAP_NS}" xmlns:t="${EWS_TYPES_NS}" xmlns:m="${EWS_MESSAGES_NS}">` +
		`<soap:Header><t:RequestServerVersion Version="Exchange2013_SP1"/>${impersonation}</soap:Header>` +
		`<soap:Body>${body}</soap:Body>` +
		`</soap:Envelope>`
	);
}

const CALENDAR_ITEM_SHAPE =
	`<t:BaseShape>IdOnly</t:BaseShape><t:AdditionalProperties>` +
	`<t:FieldURI FieldURI="item:Subject"/>` +
	`<t:FieldURI FieldURI="calendar:Start"/>` +
	`<t:FieldURI FieldURI="calendar:End"/>` +
	`<t:FieldURI FieldURI="calendar:LegacyFreeBusyStatus"/>` +
	`<t:FieldURI FieldURI="calendar:UID"/>` +
	`<t:FieldURI FieldURI="calendar:IsCancelled"/>` +
	`</t:AdditionalProperties>`;

export function buildFindCalendarItemsRequest(mailbox: string, window: ICalendarSyncWindow, maxEntries = 512): string {
	return soapEnvelope(
		`<m:FindItem Traversal="Shallow">` +
			`<m:ItemShape>${CALENDAR_ITEM_SHAPE}</m:ItemShape>` +
			`<m:CalendarView MaxEntriesReturned="${maxEntries}" StartDate="${window.start.toISOString()}" EndDate="${window.end.toISOString()}"/>` +
			`<m:ParentFolderIds><t:DistinguishedFolderId Id="calendar">` +
			`<t:Mailbox><t:EmailAddress>${escapeXml(mailbox)}</t:EmailAddress></t:Mailbox>` +
			`</t:DistinguishedFolderId></m:ParentFolderIds>` +
			`</m:FindItem>`,
		mailbox,
	);
}

export function buildSyncFolderItemsRequest(mailbox: string, syncState?: string, maxChanges = 512): string {
	return soapEnvelope(
		`<m:SyncFolderItems>` +
			`<m:ItemShape>${CALENDAR_ITEM_SHAPE}</m:ItemShape>` +
			`<m:SyncFolderId><t:DistinguishedFolderId Id="calendar">` +
			`<t:Mailbox><t:EmailAddress>${escapeXml(mailbox)}</t:EmailAddress></t:Mailbox>` +
			`</t:DistinguishedFolderId></m:SyncFolderId>${
				syncState ? `<m:SyncState>${escapeXml(syncState)}</m:SyncState>` : ''
			}<m:MaxChangesReturned>${maxChanges}</m:MaxChangesReturned>` +
			`</m:SyncFolderItems>`,
		mailbox,
	);
}

export function buildGetItemBodiesRequest(mailbox: string, itemIds: string[]): string {
	const ids = itemIds.map((id) => `<t:ItemId Id="${escapeXml(id)}"/>`).join('');
	return soapEnvelope(
		`<m:GetItem>` +
			`<m:ItemShape><t:BaseShape>IdOnly</t:BaseShape><t:AdditionalProperties>` +
			`<t:FieldURI FieldURI="item:TextBody"/>` +
			`</t:AdditionalProperties></m:ItemShape>` +
			`<m:ItemIds>${ids}</m:ItemIds>` +
			`</m:GetItem>`,
		mailbox,
	);
}

export function buildGetUserAvailabilityRequest(mailboxes: string[], window: ICalendarSyncWindow): string {
	const mailboxData = mailboxes
		.map(
			(mailbox) =>
				`<t:MailboxData><t:Email><t:Address>${escapeXml(mailbox)}</t:Address></t:Email>` +
				`<t:AttendeeType>Required</t:AttendeeType><t:ExcludeConflicts>false</t:ExcludeConflicts></t:MailboxData>`,
		)
		.join('');

	// A zero-bias timezone makes every time in the request/response UTC
	return soapEnvelope(
		`<m:GetUserAvailabilityRequest>` +
			`<t:TimeZone><t:Bias>0</t:Bias>` +
			`<t:StandardTime><t:Bias>0</t:Bias><t:Time>02:00:00</t:Time><t:DayOrder>1</t:DayOrder><t:Month>1</t:Month><t:DayOfWeek>Sunday</t:DayOfWeek></t:StandardTime>` +
			`<t:DaylightTime><t:Bias>0</t:Bias><t:Time>02:00:00</t:Time><t:DayOrder>1</t:DayOrder><t:Month>7</t:Month><t:DayOfWeek>Sunday</t:DayOfWeek></t:DaylightTime>` +
			`</t:TimeZone>` +
			`<m:MailboxDataArray>${mailboxData}</m:MailboxDataArray>` +
			`<t:FreeBusyViewOptions>` +
			`<t:TimeWindow><t:StartTime>${window.start.toISOString()}</t:StartTime><t:EndTime>${window.end.toISOString()}</t:EndTime></t:TimeWindow>` +
			`<t:MergedFreeBusyIntervalInMinutes>15</t:MergedFreeBusyIntervalInMinutes>` +
			`<t:RequestedView>FreeBusy</t:RequestedView>` +
			`</t:FreeBusyViewOptions>` +
			`</m:GetUserAvailabilityRequest>`,
	);
}

export function buildGetCalendarFolderRequest(mailbox?: string): string {
	const mailboxElement = mailbox ? `<t:Mailbox><t:EmailAddress>${escapeXml(mailbox)}</t:EmailAddress></t:Mailbox>` : '';
	return soapEnvelope(
		`<m:GetFolder>` +
			`<m:FolderShape><t:BaseShape>IdOnly</t:BaseShape></m:FolderShape>` +
			`<m:FolderIds><t:DistinguishedFolderId Id="calendar">${mailboxElement}</t:DistinguishedFolderId></m:FolderIds>` +
			`</m:GetFolder>`,
		mailbox,
	);
}

const EWS_ERROR_CODES: Record<string, string> = {
	ErrorImpersonateUserDenied: 'impersonation-denied',
	ErrorImpersonationDenied: 'impersonation-denied',
	ErrorImpersonationFailed: 'impersonation-denied',
	ErrorNonExistentMailbox: 'mailbox-not-found',
	ErrorMailboxMoveInProgress: 'mailbox-not-found',
	ErrorAccessDenied: 'access-denied',
	ErrorServerBusy: 'throttled',
	ErrorTooManyObjectsOpened: 'throttled',
	ErrorInvalidServerVersion: 'provider-error',
	// Expired/invalid incremental sync state — same recovery path as Graph's 410
	ErrorInvalidSyncStateData: 'delta-token-expired',
	ErrorSyncFolderNotFound: 'delta-token-expired',
};

export function mapEwsResponseCode(responseCode: string, messageText?: string): CalendarSyncError {
	const code = EWS_ERROR_CODES[responseCode] ?? 'provider-error';
	return new CalendarSyncError(code, `${responseCode}${messageText ? `: ${messageText}` : ''}`);
}

function parseXml(xml: string): Document {
	// The silent errorHandler keeps xmldom from writing warnings for vendor-specific quirks
	// to the console; a fatally-broken document is caught by the documentElement check below
	const doc = new DOMParser({ errorHandler: { warning: () => undefined, error: () => undefined } }).parseFromString(xml, 'text/xml');
	if (!doc?.documentElement) {
		throw new CalendarSyncError('provider-error', 'Unable to parse the EWS response as XML');
	}
	return doc;
}

function elementsNS(parent: Document | Element, ns: string, localName: string): Element[] {
	return Array.from(parent.getElementsByTagNameNS(ns, localName));
}

function textNS(parent: Element, ns: string, localName: string): string | undefined {
	const [element] = elementsNS(parent, ns, localName);
	return element?.textContent ?? undefined;
}

/** EWS availability times come back without a zone suffix; a zero-bias request makes them UTC */
export function parseEwsDate(value: string | undefined): Date | null {
	if (!value) {
		return null;
	}
	const date = new Date(/[Zz]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
	return Number.isNaN(date.getTime()) ? null : date;
}

/** Throws a mapped CalendarSyncError when the response message reports an error or a SOAP fault is present */
function assertResponseSuccess(doc: Document, responseMessageName: string): Element[] {
	const faults = elementsNS(doc, SOAP_NS, 'Fault');
	if (faults.length) {
		const faultCode = textNS(faults[0], EWS_TYPES_NS, 'ResponseCode') ?? faults[0].getElementsByTagName('faultcode')[0]?.textContent ?? '';
		const faultString = faults[0].getElementsByTagName('faultstring')[0]?.textContent ?? 'SOAP fault';
		throw mapEwsResponseCode(faultCode || 'SoapFault', faultString);
	}

	const messages = elementsNS(doc, EWS_MESSAGES_NS, responseMessageName);
	if (!messages.length) {
		throw new CalendarSyncError('provider-error', `Unexpected EWS response: missing ${responseMessageName}`);
	}

	for (const message of messages) {
		if (message.getAttribute('ResponseClass') === 'Error') {
			const responseCode = textNS(message, EWS_MESSAGES_NS, 'ResponseCode') ?? 'UnknownError';
			const messageText = textNS(message, EWS_MESSAGES_NS, 'MessageText');
			throw mapEwsResponseCode(responseCode, messageText);
		}
	}

	return messages;
}

export interface IEwsCalendarItem {
	itemId: string;
	subject: string;
	start: Date;
	end: Date;
	legacyFreeBusyStatus: string;
	uid?: string;
	isCancelled: boolean;
}

function parseCalendarItem(element: Element): IEwsCalendarItem | null {
	const [itemIdElement] = elementsNS(element, EWS_TYPES_NS, 'ItemId');
	const itemId = itemIdElement?.getAttribute('Id');
	const start = parseEwsDate(textNS(element, EWS_TYPES_NS, 'Start'));
	const end = parseEwsDate(textNS(element, EWS_TYPES_NS, 'End'));
	if (!itemId || !start || !end) {
		return null;
	}

	return {
		itemId,
		subject: textNS(element, EWS_TYPES_NS, 'Subject') ?? '',
		start,
		end,
		legacyFreeBusyStatus: textNS(element, EWS_TYPES_NS, 'LegacyFreeBusyStatus') ?? 'Busy',
		uid: textNS(element, EWS_TYPES_NS, 'UID'),
		isCancelled: textNS(element, EWS_TYPES_NS, 'IsCancelled') === 'true',
	};
}

export function parseFindItemResponse(xml: string): IEwsCalendarItem[] {
	const doc = parseXml(xml);
	assertResponseSuccess(doc, 'FindItemResponseMessage');

	return elementsNS(doc, EWS_TYPES_NS, 'CalendarItem')
		.map(parseCalendarItem)
		.filter((item): item is IEwsCalendarItem => item !== null);
}

export interface IEwsSyncFolderItemsResult {
	syncState: string;
	includesLastItemInRange: boolean;
	/** Created or updated calendar items */
	items: IEwsCalendarItem[];
	deletedItemIds: string[];
}

export function parseSyncFolderItemsResponse(xml: string): IEwsSyncFolderItemsResult {
	const doc = parseXml(xml);
	const [message] = assertResponseSuccess(doc, 'SyncFolderItemsResponseMessage');

	const syncState = textNS(message, EWS_MESSAGES_NS, 'SyncState');
	if (!syncState) {
		throw new CalendarSyncError('provider-error', 'SyncFolderItems response is missing the sync state');
	}

	const items: IEwsCalendarItem[] = [];
	const deletedItemIds: string[] = [];

	const [changes] = elementsNS(message, EWS_MESSAGES_NS, 'Changes');
	if (changes) {
		for (const change of Array.from(changes.childNodes)) {
			if (change.nodeType !== 1) {
				continue;
			}
			const element = change as Element;
			if (element.localName === 'Create' || element.localName === 'Update') {
				const [calendarItem] = elementsNS(element, EWS_TYPES_NS, 'CalendarItem');
				const item = calendarItem && parseCalendarItem(calendarItem);
				if (item) {
					items.push(item);
				}
				continue;
			}
			if (element.localName === 'Delete') {
				const [itemIdElement] = elementsNS(element, EWS_TYPES_NS, 'ItemId');
				const itemId = itemIdElement?.getAttribute('Id');
				if (itemId) {
					deletedItemIds.push(itemId);
				}
			}
		}
	}

	return {
		syncState,
		includesLastItemInRange: textNS(message, EWS_MESSAGES_NS, 'IncludesLastItemInRange') !== 'false',
		items,
		deletedItemIds,
	};
}

export function parseGetItemBodiesResponse(xml: string): Map<string, string> {
	const doc = parseXml(xml);
	assertResponseSuccess(doc, 'GetItemResponseMessage');

	const bodies = new Map<string, string>();
	for (const element of elementsNS(doc, EWS_TYPES_NS, 'CalendarItem')) {
		const [itemIdElement] = elementsNS(element, EWS_TYPES_NS, 'ItemId');
		const itemId = itemIdElement?.getAttribute('Id');
		const body = textNS(element, EWS_TYPES_NS, 'TextBody');
		if (itemId && body !== undefined) {
			bodies.set(itemId, body);
		}
	}
	return bodies;
}

export interface IEwsFreeBusyEvent {
	start: Date;
	end: Date;
	busyType: string;
}

export interface IEwsFreeBusyResponse {
	events: IEwsFreeBusyEvent[];
	errorCode?: string;
}

/** Returns one entry per requested mailbox, in request order */
export function parseAvailabilityResponse(xml: string): IEwsFreeBusyResponse[] {
	const doc = parseXml(xml);

	const faults = elementsNS(doc, SOAP_NS, 'Fault');
	if (faults.length) {
		const faultString = faults[0].getElementsByTagName('faultstring')[0]?.textContent ?? 'SOAP fault';
		throw mapEwsResponseCode('SoapFault', faultString);
	}

	const responses = elementsNS(doc, EWS_MESSAGES_NS, 'FreeBusyResponse');
	if (!responses.length) {
		throw new CalendarSyncError('provider-error', 'Unexpected EWS response: missing FreeBusyResponse');
	}

	return responses.map((response) => {
		const [responseMessage] = elementsNS(response, EWS_MESSAGES_NS, 'ResponseMessage');
		if (responseMessage?.getAttribute('ResponseClass') === 'Error') {
			return { events: [], errorCode: textNS(responseMessage, EWS_MESSAGES_NS, 'ResponseCode') ?? 'UnknownError' };
		}

		const events: IEwsFreeBusyEvent[] = [];
		for (const element of elementsNS(response, EWS_TYPES_NS, 'CalendarEvent')) {
			const start = parseEwsDate(textNS(element, EWS_TYPES_NS, 'StartTime'));
			const end = parseEwsDate(textNS(element, EWS_TYPES_NS, 'EndTime'));
			if (!start || !end) {
				continue;
			}
			events.push({ start, end, busyType: textNS(element, EWS_TYPES_NS, 'BusyType') ?? 'Busy' });
		}
		return { events };
	});
}

export function assertGetFolderSuccess(xml: string): void {
	assertResponseSuccess(parseXml(xml), 'GetFolderResponseMessage');
}
