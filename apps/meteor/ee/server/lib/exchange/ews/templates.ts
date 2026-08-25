/** Pinned so a server upgrade cannot silently change the response shape. */
const REQUEST_SERVER_VERSION = 'Exchange2013';

const XML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&apos;',
};

/** Every interpolated value goes through this: a single unescaped `&` produces a malformed envelope. */
export const escapeXml = (value: string): string => value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);

/**
 * `ExchangeImpersonation` is what lets one service account read many mailboxes: Exchange evaluates the
 * request as that user, who is never prompted and has no session involved.
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

export const findFolderRequest = (mailbox: string, wellKnownFolder: 'calendar' | 'contacts'): string =>
	envelope(
		[
			'<m:FindFolder Traversal="Shallow">',
			'<m:FolderShape><t:BaseShape>IdOnly</t:BaseShape></m:FolderShape>',
			`<m:ParentFolderIds><t:DistinguishedFolderId Id="${wellKnownFolder}">`,
			`<t:Mailbox><t:EmailAddress>${escapeXml(mailbox)}</t:EmailAddress></t:Mailbox>`,
			'</t:DistinguishedFolderId></m:ParentFolderIds>',
			'</m:FindFolder>',
		].join(''),
		mailbox,
	);

/**
 * The EWS delta query. `SyncState` is the resume token; omit it for an initial sync.
 *
 * Returns the master item of a recurring series rather than expanded occurrences, unlike `CalendarView`.
 * Whether we have to expand recurrences ourselves is still open.
 */
export const syncFolderItemsRequest = (mailbox: string, folderId: string, syncState?: string, maxChanges = 100): string =>
	envelope(
		[
			'<m:SyncFolderItems>',
			'<m:ItemShape><t:BaseShape>IdOnly</t:BaseShape></m:ItemShape>',
			`<m:SyncFolderId><t:FolderId Id="${escapeXml(folderId)}"/></m:SyncFolderId>`,
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

/** Free/busy-only mode: availability without subjects or bodies. */
export const getUserAvailabilityRequest = (mailbox: string, start: Date, end: Date): string =>
	envelope(
		[
			'<m:GetUserAvailabilityRequest>',
			'<t:TimeZone><t:Bias>0</t:Bias>',
			'<t:StandardTime><t:Bias>0</t:Bias><t:Time>00:00:00</t:Time><t:DayOrder>1</t:DayOrder><t:Month>1</t:Month><t:DayOfWeek>Sunday</t:DayOfWeek></t:StandardTime>',
			'<t:DaylightTime><t:Bias>0</t:Bias><t:Time>00:00:00</t:Time><t:DayOrder>1</t:DayOrder><t:Month>1</t:Month><t:DayOfWeek>Sunday</t:DayOfWeek></t:DaylightTime>',
			'</t:TimeZone>',
			'<m:MailboxDataArray><t:MailboxData>',
			`<t:Email><t:Address>${escapeXml(mailbox)}</t:Address></t:Email>`,
			'<t:AttendeeType>Required</t:AttendeeType>',
			'</t:MailboxData></m:MailboxDataArray>',
			'<t:FreeBusyViewOptions>',
			`<t:TimeWindow><t:StartTime>${toEwsDateTime(start)}</t:StartTime><t:EndTime>${toEwsDateTime(end)}</t:EndTime></t:TimeWindow>`,
			'<t:MergedFreeBusyIntervalInMinutes>15</t:MergedFreeBusyIntervalInMinutes>',
			'<t:RequestedView>DetailedMerged</t:RequestedView>',
			'</t:FreeBusyViewOptions>',
			'</m:GetUserAvailabilityRequest>',
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

/** EWS rejects the milliseconds `toISOString` emits in some operations. */
function toEwsDateTime(date: Date): string {
	return `${date.toISOString().replace(/\.\d{3}Z$/, 'Z')}`;
}
