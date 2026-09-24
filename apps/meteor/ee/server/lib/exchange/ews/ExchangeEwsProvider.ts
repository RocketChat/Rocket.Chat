import type { IEwsTransport } from './IEwsTransport';
import {
	allByTag,
	attributeOf,
	dictionaryEntries,
	firstByTag,
	MESSAGES_NS,
	parseEwsDateTime,
	parseEwsResponse,
	textOf,
	TYPES_NS,
} from './parseResponse';
import {
	DEFAULT_CONTACT_FOLDER_ID,
	findContactFoldersRequest,
	findItemCalendarViewRequest,
	getAttachmentsRequest,
	getContactAttachmentIdsRequest,
	getContactItemsRequest,
	getItemRequest,
	resolveNamesRequest,
	syncContactFolderItemsRequest,
	syncFolderItemsRequest,
} from './templates';
import type { IExchangeProvider } from '../definition/IExchangeProvider';
import type {
	ContactFolder,
	DateRange,
	ExchangeContact,
	ExchangeContactEmail,
	ExchangeContactPhone,
	ExchangeContactPhoto,
	ExchangeContactUpsert,
	ExchangeEvent,
	ExchangeProviderCapabilities,
	Page,
} from '../definition/types';
import { ExchangeError } from '../errors';
import { logger } from '../logger';
import { MAX_CONTACT_PHOTO_BYTES } from '../sync/limits';

const PHONE_LABELS: Record<string, string> = {
	MobilePhone: 'mobile',
	BusinessPhone: 'business',
	BusinessPhone2: 'business',
	HomePhone: 'home',
	HomePhone2: 'home',
};

/** How many photos one `GetAttachment` may carry. Capped to 20 for simetry with the Graph implementation.*/
const PHOTO_BATCH_SIZE = 20;

/** How many contacts one `GetItem` is asked about. Higher than a photo batch because it carries no bytes. */
const PHOTO_LOOKUP_BATCH_SIZE = 100;

/** At 1000 occurrences a page, past any window a person can fill. An emergency guard, not a working limit. */
const MAX_CALENDAR_VIEW_PAGES = 50;

/** How many events one `GetItem` is asked for, matching the delta's own page size. */
const EVENT_BATCH_SIZE = 100;

const CONTACT_FOLDER_CLASS = 'IPF.Contact';

/** At 100 folders a page, far past any real address book. A backstop against a server that never says it is done. */
const MAX_FOLDER_PAGES = 50;

const isBusyStatus = (status: string | undefined): boolean => status === 'Busy';

export class ExchangeEwsProvider implements IExchangeProvider {
	public readonly id = 'ews' as const;

	public readonly capabilities: ExchangeProviderCapabilities = {
		supportsWebhooks: false,
	};

	private readonly transport: IEwsTransport;

	private readonly serviceAccountAddress: string;

	constructor(transport: IEwsTransport, serviceAccountAddress = '') {
		this.transport = transport;
		this.serviceAccountAddress = serviceAccountAddress;
	}

	/**
	 * Whether the name resolves is beside the point: a completed round trip already proves the endpoint,
	 * TLS and the credentials, so "not found" counts as success.	 */
	public async testConnection(): Promise<void> {
		try {
			parseEwsResponse(await this.transport.post(resolveNamesRequest(this.serviceAccountAddress)));
		} catch (err) {
			if (err instanceof ExchangeError && err.code === 'mailbox-not-found') {
				return;
			}

			throw err;
		}
	}

	public async listEvents(mailbox: string, timeWindow: DateRange, cursor?: string): Promise<Page<ExchangeEvent>> {
		const doc = parseEwsResponse(await this.transport.post(syncFolderItemsRequest(mailbox, cursor)));
		const syncState = textOf(firstByTag(doc, MESSAGES_NS, 'SyncState'));
		// EWS reports "true" when it handed over everything, which is the inverse of hasMore.
		const includesLastItem = textOf(firstByTag(doc, MESSAGES_NS, 'IncludesLastItemInRange')) === 'true';
		const changed = ['Create', 'Update', 'Delete'].some((tag) => allByTag(doc, TYPES_NS, tag).length > 0);

		if (!changed) {
			return { items: [], cursor: syncState, hasMore: !includesLastItem, coverage: 'delta' };
		}

		const { events, complete } = await this.snapshotWindow(mailbox, timeWindow);

		return {
			items: events,
			cursor: syncState,
			hasMore: !includesLastItem,
			// Calling a short read full is what would delete the events we failed to read.
			coverage: complete ? 'full' : 'partial',
		};
	}

	/**
	 * The delta is used as a 'Has something changed?', not as a source of items. What it reports cannot be used
	 * directly: a changed series arrives as its master rather than as occurrences, and an occurrence deleted
	 * from a series is not reported at all. So once anything was modified, Exchange expands the whole window
	 * and the caller reconciles against a complete set, which is what the desktop integration has always done.
	 */
	private async snapshotWindow(mailbox: string, timeWindow: DateRange): Promise<{ events: ExchangeEvent[]; complete: boolean }> {
		const ids = new Set<string>();
		let { start } = timeWindow;
		let complete = false;

		for (let page = 0; page < MAX_CALENDAR_VIEW_PAGES; page++) {
			const doc = parseEwsResponse(await this.transport.post(findItemCalendarViewRequest(mailbox, start, timeWindow.end)));
			const root = firstByTag(doc, MESSAGES_NS, 'RootFolder');
			const nodes = allByTag(doc, TYPES_NS, 'CalendarItem');

			for (const node of nodes) {
				const id = firstByTag(node, TYPES_NS, 'ItemId')?.getAttribute('Id');

				if (id) {
					ids.add(id);
				}
			}

			if (root?.getAttribute('IncludesLastItemInRange') !== 'false') {
				complete = true;
				break;
			}

			const last = nodes[nodes.length - 1];
			const next = last && parseEwsDateTime(textOf(firstByTag(last, TYPES_NS, 'Start')));

			if (!next || next.getTime() <= start.getTime()) {
				break;
			}

			start = next;
		}

		if (!complete) {
			logger.warn({ msg: 'EWS calendar window was read only in part, so nothing will be pruned from it', mailbox });
		}

		return { events: await this.loadEvents(mailbox, [...ids]), complete };
	}

	private async loadEvents(mailbox: string, itemIds: string[]): Promise<ExchangeEvent[]> {
		const events: ExchangeEvent[] = [];

		for (let i = 0; i < itemIds.length; i += EVENT_BATCH_SIZE) {
			const doc = parseEwsResponse(await this.transport.post(getItemRequest(mailbox, itemIds.slice(i, i + EVENT_BATCH_SIZE))));

			events.push(
				...allByTag(doc, TYPES_NS, 'CalendarItem')
					.filter((node) => textOf(firstByTag(node, TYPES_NS, 'CalendarItemType')) !== 'RecurringMaster')
					.map((node) => this.toExchangeEvent(node))
					.filter((event): event is ExchangeEvent => event !== undefined),
			);
		}

		return events;
	}

	private toExchangeEvent(node: Element): ExchangeEvent | undefined {
		const externalId = firstByTag(node, TYPES_NS, 'ItemId')?.getAttribute('Id') ?? undefined;
		if (!externalId) {
			logger.warn({ msg: 'Skipping EWS calendar item without an id' });
			return undefined;
		}

		const startTime = parseEwsDateTime(textOf(firstByTag(node, TYPES_NS, 'Start')));
		if (!startTime) {
			logger.warn({ msg: 'Skipping EWS calendar item without a parseable start time', externalId });
			return undefined;
		}

		const endTime = parseEwsDateTime(textOf(firstByTag(node, TYPES_NS, 'End')));
		const reminder = textOf(firstByTag(node, TYPES_NS, 'ReminderMinutesBeforeStart'));
		const reminderMinutes = reminder ? Number.parseInt(reminder, 10) : undefined;

		return {
			kind: 'upsert',
			externalId,
			subject: textOf(firstByTag(node, TYPES_NS, 'Subject')) ?? '',
			description: textOf(firstByTag(node, TYPES_NS, 'Body')) ?? '',
			startTime,
			...(endTime && { endTime }),
			isCancelled: textOf(firstByTag(node, TYPES_NS, 'IsCancelled')) === 'true',
			busy: isBusyStatus(textOf(firstByTag(node, TYPES_NS, 'LegacyFreeBusyStatus'))),
			...(reminderMinutes !== undefined && Number.isFinite(reminderMinutes) && { reminderMinutesBeforeStart: reminderMinutes }),
		};
	}

	public async listContactFolders(mailbox: string): Promise<ContactFolder[]> {
		const folders: ContactFolder[] = [{ id: DEFAULT_CONTACT_FOLDER_ID, displayName: 'Contacts' }];
		let offset = 0;

		for (let page = 0; page < MAX_FOLDER_PAGES; page++) {
			const doc = parseEwsResponse(await this.transport.post(findContactFoldersRequest(mailbox, offset)));
			const root = firstByTag(doc, MESSAGES_NS, 'RootFolder');
			const found = allByTag(doc, TYPES_NS, 'ContactsFolder');

			for (const node of found) {
				const id = attributeOf(node, 'FolderId', 'Id');

				if (!id) {
					logger.warn({ msg: 'Skipping EWS contact folder without an id' });
					continue;
				}

				if (textOf(firstByTag(node, TYPES_NS, 'FolderClass')) !== CONTACT_FOLDER_CLASS) {
					continue;
				}

				folders.push({ id, displayName: textOf(firstByTag(node, TYPES_NS, 'DisplayName')) ?? '' });
			}

			if (root?.getAttribute('IncludesLastFolderInRange') !== 'false' || !found.length) {
				return folders;
			}

			offset = Number(root.getAttribute('IndexedPagingOffset')) || offset + found.length;
		}

		logger.error({ msg: 'EWS contact folders paged out, the rest of them will not sync', mailbox, listed: folders.length });

		return folders;
	}

	public async listContacts(mailbox: string, folderId: string, cursor?: string): Promise<Page<ExchangeContact>> {
		const doc = parseEwsResponse(await this.transport.post(syncContactFolderItemsRequest(mailbox, folderId, cursor)));

		const syncState = textOf(firstByTag(doc, MESSAGES_NS, 'SyncState'));
		// EWS reports "true" when it handed over everything, which is the inverse of hasMore.
		const includesLastItem = textOf(firstByTag(doc, MESSAGES_NS, 'IncludesLastItemInRange')) === 'true';

		const removals: ExchangeContact[] = allByTag(doc, TYPES_NS, 'Delete')
			.map((node) => attributeOf(node, 'ItemId', 'Id'))
			.filter((externalId): externalId is string => Boolean(externalId))
			.map((externalId) => ({ kind: 'deleted', externalId, folderId }));

		const changedIds = ['Create', 'Update']
			.flatMap((tag) => allByTag(doc, TYPES_NS, tag))
			.map((node) => attributeOf(node, 'ItemId', 'Id'))
			.filter((id): id is string => Boolean(id));

		const upserts = changedIds.length ? await this.loadContacts(mailbox, folderId, changedIds) : [];

		return {
			items: [...upserts, ...removals],
			cursor: syncState,
			hasMore: !includesLastItem,
			// Never a complete read: what is gone arrives as a deletion rather than by being absent.
			coverage: 'delta',
		};
	}

	/** The delta only carries ids, so the fields come from a second call. */
	private async loadContacts(mailbox: string, folderId: string, itemIds: string[]): Promise<ExchangeContact[]> {
		const doc = parseEwsResponse(await this.transport.post(getContactItemsRequest(mailbox, itemIds)));

		return allByTag(doc, TYPES_NS, 'Contact')
			.map((node) => this.toExchangeContact(node, folderId))
			.filter((contact): contact is ExchangeContactUpsert => contact !== undefined);
	}

	private toExchangeContact(node: Element, folderId: string): ExchangeContactUpsert | undefined {
		const externalId = attributeOf(node, 'ItemId', 'Id');

		if (!externalId) {
			logger.warn({ msg: 'Skipping EWS contact without an id' });
			return undefined;
		}

		const givenName = textOf(firstByTag(node, TYPES_NS, 'GivenName'));
		const surname = textOf(firstByTag(node, TYPES_NS, 'Surname'));
		const companyName = textOf(firstByTag(node, TYPES_NS, 'CompanyName'));
		const officeLocation = textOf(firstByTag(node, TYPES_NS, 'OfficeLocation'));

		const categoriesNode = firstByTag(node, TYPES_NS, 'Categories');
		const categories = categoriesNode
			? allByTag(categoriesNode, TYPES_NS, 'String')
					.map((entry) => textOf(entry))
					.filter((category): category is string => Boolean(category))
			: [];

		const emails: ExchangeContactEmail[] = dictionaryEntries(node, 'EmailAddresses').map(({ value }) => ({ address: value }));

		const phones: ExchangeContactPhone[] = dictionaryEntries(node, 'PhoneNumbers').map(({ key, value }) => ({
			raw: value,
			...(PHONE_LABELS[key] && { label: PHONE_LABELS[key] }),
		}));

		const fullName = [givenName, surname].filter(Boolean).join(' ');
		const displayName = textOf(firstByTag(node, TYPES_NS, 'DisplayName')) || fullName || emails[0]?.address || phones[0]?.raw;

		if (!displayName) {
			logger.warn({ msg: 'Skipping EWS contact with nothing to resolve it by', externalId });
			return undefined;
		}

		return {
			kind: 'upsert',
			externalId,
			folderId,
			displayName,
			...(givenName && { givenName }),
			...(surname && { surname }),
			...(companyName && { companyName }),
			...(officeLocation && { officeLocation }),
			emails,
			phones,
			categories,
		};
	}

	/** It takes two calls: one to learn which contacts carry one and what its attachment id is, another to read the bytes. */
	public async *getContactPhotos(mailbox: string, externalIds: string[]): AsyncIterable<ExchangeContactPhoto> {
		for (let i = 0; i < externalIds.length; i += PHOTO_LOOKUP_BATCH_SIZE) {
			const owners = await this.findPhotoAttachments(mailbox, externalIds.slice(i, i + PHOTO_LOOKUP_BATCH_SIZE));
			const attachmentIds = [...owners.keys()];

			for (let j = 0; j < attachmentIds.length; j += PHOTO_BATCH_SIZE) {
				yield* await this.readPhotos(mailbox, attachmentIds.slice(j, j + PHOTO_BATCH_SIZE), owners);
			}
		}
	}

	private async findPhotoAttachments(mailbox: string, externalIds: string[]): Promise<Map<string, string>> {
		const doc = parseEwsResponse(await this.transport.post(getContactAttachmentIdsRequest(mailbox, externalIds)));

		const owners = new Map<string, string>();

		for (const contact of allByTag(doc, TYPES_NS, 'Contact')) {
			const externalId = attributeOf(contact, 'ItemId', 'Id');

			if (!externalId) {
				continue;
			}

			for (const attachment of allByTag(contact, TYPES_NS, 'FileAttachment')) {
				// A contact can carry ordinary attachments too, and only one of them is the picture.
				if (textOf(firstByTag(attachment, TYPES_NS, 'IsContactPhoto')) !== 'true') {
					continue;
				}

				const attachmentId = attributeOf(attachment, 'AttachmentId', 'Id');

				if (attachmentId) {
					owners.set(attachmentId, externalId);
				}
			}
		}

		return owners;
	}

	private async readPhotos(mailbox: string, attachmentIds: string[], owners: Map<string, string>): Promise<ExchangeContactPhoto[]> {
		const doc = parseEwsResponse(await this.transport.post(getAttachmentsRequest(mailbox, attachmentIds)));
		const photos: ExchangeContactPhoto[] = [];

		for (const attachment of allByTag(doc, TYPES_NS, 'FileAttachment')) {
			const attachmentId = attributeOf(attachment, 'AttachmentId', 'Id');
			const externalId = attachmentId && owners.get(attachmentId);
			const content = textOf(firstByTag(attachment, TYPES_NS, 'Content'));

			if (!externalId || !content) {
				continue;
			}

			const data = new Uint8Array(Buffer.from(content, 'base64'));

			if (!data.byteLength) {
				continue;
			}

			if (data.byteLength > MAX_CONTACT_PHOTO_BYTES) {
				logger.warn({ msg: 'Skipping an EWS contact photo above the size cap', externalId, bytes: data.byteLength });
				continue;
			}

			photos.push({
				data,
				contentType: textOf(firstByTag(attachment, TYPES_NS, 'ContentType')) ?? 'image/jpeg',
				externalId,
			});
		}

		return photos;
	}
}
