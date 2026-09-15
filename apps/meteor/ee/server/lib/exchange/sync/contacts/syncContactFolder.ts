import type { IUser } from '@rocket.chat/core-typings';
import type { ImportedContact } from '@rocket.chat/model-typings';
import { Contacts, ExchangeContactSyncState } from '@rocket.chat/models';

import { normalizeE164 } from './normalizeE164';
import type { IExchangeProvider } from '../../definition/IExchangeProvider';
import type { ExchangeContactUpsert } from '../../definition/types';
import { isExchangeError } from '../../errors';
import { logger } from '../../logger';
import { scrubForLog, scrubText } from '../../scrub';
import { MAX_PAGES } from '../limits';

const FATAL_CODES = new Set(['not-configured', 'host-not-allowed', 'authentication-failed', 'rate-limited']);

export type ContactFolderSyncOutcome = {
	upserted: number;
	modified: number;
	deleted: number;
	pruned: number;
	failed: boolean;
	fatal: boolean;
	error?: unknown;
};

const EMPTY: ContactFolderSyncOutcome = { upserted: 0, modified: 0, deleted: 0, pruned: 0, failed: false, fatal: false };

const toContact = (uid: IUser['_id'], contact: ExchangeContactUpsert, defaultRegion: string): ImportedContact => ({
	uid,
	externalId: contact.externalId,
	folderId: contact.folderId,
	displayName: contact.displayName,
	...(contact.givenName && { givenName: contact.givenName }),
	...(contact.surname && { surname: contact.surname }),
	...(contact.companyName && { companyName: contact.companyName }),
	...(contact.officeLocation && { officeLocation: contact.officeLocation }),
	emails: contact.emails,
	categories: contact.categories,
	// Normalizing here rather than in the providers keeps one region policy instead of one per provider.
	phones: contact.phones.map(({ raw, label }) => {
		const e164 = normalizeE164(raw, defaultRegion);

		return { raw, ...(e164 && { e164 }), ...(label && { label }) };
	}),
});

type Collected = {
	upserts: Map<string, ExchangeContactUpsert>;
	removals: Set<string>;
	/** Present only when a provider handed over a complete read of the folder. */
	keepExternalIds?: string[];
	cursor?: string;
};

const collectPages = async (
	provider: Required<Pick<IExchangeProvider, 'listContacts'>>,
	mailbox: string,
	folderId: string,
	startCursor: string | undefined,
): Promise<Collected> => {
	const upserts = new Map<string, ExchangeContactUpsert>();
	const removals = new Set<string>();
	let keepExternalIds: string[] | undefined;
	let cursor = startCursor;
	let pages = 0;

	for (;;) {
		const page = await provider.listContacts(mailbox, folderId, cursor);
		pages++;
		const pageUpserts: ExchangeContactUpsert[] = [];

		for (const item of page.items) {
			if (item.kind === 'deleted') {
				removals.add(item.externalId);
				upserts.delete(item.externalId);
				continue;
			}

			pageUpserts.push(item);
		}

		for (const item of pageUpserts) {
			removals.delete(item.externalId);
			upserts.set(item.externalId, item);
		}

		// Each complete page is an independent full read of the folder, so the newest one supersedes any earlier one
		if (page.isCompleteForWindow) {
			keepExternalIds = pageUpserts.map(({ externalId }) => externalId);
		}

		cursor = page.cursor;

		if (!page.hasMore || !page.cursor || pages >= MAX_PAGES) {
			return { upserts, removals, keepExternalIds, cursor };
		}
	}
};

export const syncContactFolder = async (
	provider: IExchangeProvider,
	uid: IUser['_id'],
	mailbox: string,
	folderId: string,
	defaultRegion: string,
): Promise<ContactFolderSyncOutcome> => {
	if (!provider.listContacts) {
		return EMPTY;
	}

	const listContacts = provider.listContacts.bind(provider);
	const identity = { mailbox, provider: provider.id };

	const state = await ExchangeContactSyncState.findOneByUserIdAndFolder(uid, folderId);

	// No window here, unlike the calendar: a contact folder cursor only goes stale when the source changes.
	const sameSource = state?.mailbox === mailbox && state?.provider === provider.id;
	const reusable = Boolean(state?.cursor) && sameSource;

	try {
		const { upserts, removals, keepExternalIds, cursor } = await collectPages(
			{ listContacts },
			mailbox,
			folderId,
			reusable ? state?.cursor : undefined,
		);

		const imported = await Contacts.bulkUpsertImported(
			[...upserts.values()].map((contact) => toContact(uid, contact, defaultRegion)),
			new Date(),
		);

		const deleted = removals.size ? await Contacts.deleteImportedByExternalIds(uid, folderId, [...removals]) : undefined;

		// Only from a complete read, and only after the upserts landed.
		const pruned = keepExternalIds ? await Contacts.deleteImportedOutsideSet(uid, folderId, keepExternalIds) : undefined;

		await ExchangeContactSyncState.saveCursor(uid, folderId, identity, cursor, new Date());

		return {
			upserted: imported.upsertedCount,
			modified: imported.modifiedCount,
			deleted: deleted?.deletedCount ?? 0,
			pruned: pruned?.deletedCount ?? 0,
			failed: false,
			fatal: false,
		};
	} catch (err) {
		const code = isExchangeError(err) ? err.code : 'unknown';

		if (code === 'sync-state-invalid') {
			await ExchangeContactSyncState.clearCursor(uid, folderId);
		}

		await ExchangeContactSyncState.setLastError(
			uid,
			folderId,
			identity,
			`${code}: ${scrubText(err instanceof Error ? err.message : String(err))}`,
		);

		logger.warn({ msg: 'Exchange contact folder sync failed', uid, folderId, code, err: scrubForLog(err) });

		return { ...EMPTY, failed: true, fatal: FATAL_CODES.has(code), error: err };
	}
};
