import type { Binary, Db, MongoClient } from 'mongodb';

import type { Store } from './store';
import type { CollectionPolicy, Logger, SiteId } from './types';

export type Context = {
	client: MongoClient;
	db: Db;
	store: Store;
	site: SiteId;
	siteName: string;
	peer: SiteId;
	policies: Map<string, CollectionPolicy>;
	messagesCollection: string;
	logger: Logger;
	/** Sessions this site's replicator applied peer writes with; changes made in them are not captured again. */
	ownSessions: Set<string>;
};

export const sessionKey = (lsid: { id: Binary } | undefined): string | undefined => lsid?.id?.toString('hex');

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
