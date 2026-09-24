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
			'<t:FieldURI FieldURI="calendar:IsCancelled"/>',
			'<t:FieldURI FieldURI="calendar:LegacyFreeBusyStatus"/>',
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
 * 1000 is what Exchange's default throttling policy allows a Find to hold; asking for more has no effect,
 * and an admin who lowered it gets a truncated page back, which is why this pages either way.
 */
export const findItemCalendarViewRequest = (mailbox: string, start: Date, end: Date, maxEntries = 1000): string =>
	envelope(
		[
			'<m:FindItem Traversal="Shallow">',
			'<m:ItemShape><t:BaseShape>IdOnly</t:BaseShape>',
			// `CalendarView` takes no offset, so the only way to page it is to reopen the window at the last
			// occurrence seen. That start time is the cursor, which makes it the one field worth asking for here.
			'<t:AdditionalProperties><t:FieldURI FieldURI="calendar:Start"/></t:AdditionalProperties>',
			'</m:ItemShape>',
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

export const DEFAULT_CONTACT_FOLDER_ID = 'contacts';

// The Contacts root is addressed by its distinguished name, every other folder by its opaque id.
const contactFolderId = (folderId: string): string =>
	folderId === DEFAULT_CONTACT_FOLDER_ID
		? `<t:DistinguishedFolderId Id="${DEFAULT_CONTACT_FOLDER_ID}"/>`
		: `<t:FolderId Id="${escapeXml(folderId)}"/>`;

/* Deep, because a user can nest contact folders, and the root is added by the caller. `offset` walks the pages */
export const findContactFoldersRequest = (mailbox: string, offset = 0, maxEntries = 100): string =>
	envelope(
		[
			'<m:FindFolder Traversal="Deep">',
			'<m:FolderShape><t:BaseShape>IdOnly</t:BaseShape>',
			'<t:AdditionalProperties><t:FieldURI FieldURI="folder:DisplayName"/><t:FieldURI FieldURI="folder:FolderClass"/></t:AdditionalProperties>',
			'</m:FolderShape>',
			`<m:IndexedPageFolderView MaxEntriesReturned="${maxEntries}" Offset="${offset}" BasePoint="Beginning"/>`,
			`<m:ParentFolderIds><t:DistinguishedFolderId Id="${DEFAULT_CONTACT_FOLDER_ID}"/></m:ParentFolderIds>`,
			'</m:FindFolder>',
		].join(''),
		mailbox,
	);

export const syncContactFolderItemsRequest = (mailbox: string, folderId: string, syncState?: string, maxChanges = 100): string =>
	envelope(
		[
			'<m:SyncFolderItems>',
			'<m:ItemShape><t:BaseShape>IdOnly</t:BaseShape></m:ItemShape>',
			`<m:SyncFolderId>${contactFolderId(folderId)}</m:SyncFolderId>`,
			syncState ? `<m:SyncState>${escapeXml(syncState)}</m:SyncState>` : '',
			`<m:MaxChangesReturned>${maxChanges}</m:MaxChangesReturned>`,
			'<m:SyncScope>NormalItems</m:SyncScope>',
			'</m:SyncFolderItems>',
		].join(''),
		mailbox,
	);

const PHONE_KEYS = [
	'AssistantPhone',
	'BusinessFax',
	'BusinessPhone',
	'BusinessPhone2',
	'Callback',
	'CarPhone',
	'CompanyMainPhone',
	'HomeFax',
	'HomePhone',
	'HomePhone2',
	'Isdn',
	'MobilePhone',
	'OtherFax',
	'OtherTelephone',
	'Pager',
	'PrimaryPhone',
	'RadioPhone',
	'Telex',
	'TtyTddPhone',
];

const EMAIL_KEYS = ['EmailAddress1', 'EmailAddress2', 'EmailAddress3'];

export const getContactItemsRequest = (mailbox: string, itemIds: string[]): string =>
	envelope(
		[
			'<m:GetItem>',
			'<m:ItemShape>',
			'<t:BaseShape>IdOnly</t:BaseShape>',
			'<t:AdditionalProperties>',
			'<t:FieldURI FieldURI="contacts:DisplayName"/>',
			'<t:FieldURI FieldURI="contacts:GivenName"/>',
			'<t:FieldURI FieldURI="contacts:Surname"/>',
			'<t:FieldURI FieldURI="contacts:CompanyName"/>',
			'<t:FieldURI FieldURI="contacts:OfficeLocation"/>',
			'<t:FieldURI FieldURI="item:Categories"/>',
			EMAIL_KEYS.map((key) => `<t:IndexedFieldURI FieldURI="contacts:EmailAddress" FieldIndex="${key}"/>`).join(''),
			PHONE_KEYS.map((key) => `<t:IndexedFieldURI FieldURI="contacts:PhoneNumber" FieldIndex="${key}"/>`).join(''),
			'</t:AdditionalProperties>',
			'</m:ItemShape>',
			'<m:ItemIds>',
			itemIds.map((id) => `<t:ItemId Id="${escapeXml(id)}"/>`).join(''),
			'</m:ItemIds>',
			'</m:GetItem>',
		].join(''),
		mailbox,
	);

export const getContactAttachmentIdsRequest = (mailbox: string, itemIds: string[]): string =>
	envelope(
		[
			'<m:GetItem>',
			'<m:ItemShape>',
			'<t:BaseShape>IdOnly</t:BaseShape>',
			'<t:AdditionalProperties><t:FieldURI FieldURI="item:Attachments"/></t:AdditionalProperties>',
			'</m:ItemShape>',
			'<m:ItemIds>',
			itemIds.map((id) => `<t:ItemId Id="${escapeXml(id)}"/>`).join(''),
			'</m:ItemIds>',
			'</m:GetItem>',
		].join(''),
		mailbox,
	);

export const getAttachmentsRequest = (mailbox: string, attachmentIds: string[]): string =>
	envelope(
		[
			'<m:GetAttachment>',
			'<m:AttachmentShape><t:IncludeMimeContent>false</t:IncludeMimeContent></m:AttachmentShape>',
			'<m:AttachmentIds>',
			attachmentIds.map((id) => `<t:AttachmentId Id="${escapeXml(id)}"/>`).join(''),
			'</m:AttachmentIds>',
			'</m:GetAttachment>',
		].join(''),
		mailbox,
	);
