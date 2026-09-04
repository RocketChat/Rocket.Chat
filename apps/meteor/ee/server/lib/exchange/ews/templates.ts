/** Pinned so a server upgrade cannot silently change the response shape. */
const REQUEST_SERVER_VERSION = 'Exchange2013';

const XML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&apos;',
};

export const escapeXml = (value: string): string => value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);

/**
 * `ExchangeImpersonation` is what lets one service account read many mailboxes
 */
export const envelope = (body: string, impersonatedMailbox?: string): string => {
	const impersonation = impersonatedMailbox
		? `<t:ExchangeImpersonation><t:ConnectingSID><t:PrimarySmtpAddress>${escapeXml(
				impersonatedMailbox,
			)}</t:PrimarySmtpAddress></t:ConnectingSID></t:ExchangeImpersonation>`
		: '';

	return [
		'<?xml version="1.0" encoding="utf-8"?>',
		'<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"',
		' xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"',
		' xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages">',
		'<soap:Header>',
		`<t:RequestServerVersion Version="${REQUEST_SERVER_VERSION}"/>`,
		// Without this, Exchange answers in the mailbox's own timezone.
		'<t:TimeZoneContext><t:TimeZoneDefinition Id="UTC"/></t:TimeZoneContext>',
		impersonation,
		'</soap:Header>',
		'<soap:Body>',
		body,
		'</soap:Body>',
		'</soap:Envelope>',
	].join('');
};

/**
 * The EWS delta query. `syncState` is the resume token; omit it for an initial sync.
 */
export const syncFolderItemsRequest = (mailbox: string, syncState?: string, maxChanges = 100): string =>
	envelope(
		[
			'<m:SyncFolderItems>',
			'<m:ItemShape><t:BaseShape>IdOnly</t:BaseShape></m:ItemShape>',
			'<m:SyncFolderId><t:DistinguishedFolderId Id="calendar"/></m:SyncFolderId>',
			syncState ? `<m:SyncState>${escapeXml(syncState)}</m:SyncState>` : '',
			`<m:MaxChangesReturned>${maxChanges}</m:MaxChangesReturned>`,
			'<m:SyncScope>NormalItems</m:SyncScope>',
			'</m:SyncFolderItems>',
		].join(''),
		mailbox,
	);

export const getItemRequest = (mailbox: string, itemIds: string[]): string =>
	envelope(
		[
			'<m:GetItem>',
			'<m:ItemShape>',
			'<t:BaseShape>IdOnly</t:BaseShape>',
			'<t:AdditionalProperties>',
			'<t:FieldURI FieldURI="item:Subject"/>',
			'<t:FieldURI FieldURI="item:Body"/>',
			'<t:FieldURI FieldURI="calendar:Start"/>',
			'<t:FieldURI FieldURI="calendar:End"/>',
			'<t:FieldURI FieldURI="calendar:IsAllDayEvent"/>',
			'<t:FieldURI FieldURI="calendar:IsCancelled"/>',
			'<t:FieldURI FieldURI="calendar:LegacyFreeBusyStatus"/>',
			'<t:FieldURI FieldURI="calendar:UID"/>',
			'<t:FieldURI FieldURI="calendar:CalendarItemType"/>',
			'<t:FieldURI FieldURI="item:ReminderMinutesBeforeStart"/>',
			'</t:AdditionalProperties>',
			'</m:ItemShape>',
			'<m:ItemIds>',
			itemIds.map((id) => `<t:ItemId Id="${escapeXml(id)}"/>`).join(''),
			'</m:ItemIds>',
			'</m:GetItem>',
		].join(''),
		mailbox,
	);

/** The only operation that carries no impersonation header, so it runs as the service account itself. */
export const resolveNamesRequest = (mailbox: string): string =>
	envelope(
		[
			'<m:ResolveNames ReturnFullContactData="false">',
			`<m:UnresolvedEntry>${escapeXml(mailbox)}</m:UnresolvedEntry>`,
			'</m:ResolveNames>',
		].join(''),
	);

/**
 * Exchange expands a recurring series into its occurrences server side, which is what keeps recurrence
 * patterns and their originating timezones out of our code. `IdOnly` because FindItem never returns a
 * body: detail comes from the GetItem that follows.
 */
export const findItemCalendarViewRequest = (mailbox: string, start: Date, end: Date, maxEntries = 500): string =>
	envelope(
		[
			'<m:FindItem Traversal="Shallow">',
			'<m:ItemShape><t:BaseShape>IdOnly</t:BaseShape></m:ItemShape>',
			`<m:CalendarView StartDate="${toEwsDateTime(start)}" EndDate="${toEwsDateTime(end)}" MaxEntriesReturned="${maxEntries}"/>`,
			'<m:ParentFolderIds><t:DistinguishedFolderId Id="calendar"/></m:ParentFolderIds>',
			'</m:FindItem>',
		].join(''),
		mailbox,
	);

/** EWS rejects the milliseconds `toISOString` emits in some operations. */
function toEwsDateTime(date: Date): string {
	return `${date.toISOString().replace(/\.\d{3}Z$/, 'Z')}`;
}
