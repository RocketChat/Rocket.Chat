export const E2EE_SEARCH_LIMITS = Object.freeze({
	defaultResults: 50,
	maxResults: 100,
	maxQueryTokens: 16,
	maxBatchDocuments: 500,
	maxDocumentBodyCodeUnits: 64 * 1024,
	maxBatchBodyCodeUnits: 2 * 1024 * 1024,
});

export type E2EESearchDocKind = 'text' | 'file' | 'attachment';

export type E2EESearchDoc = {
	id: string;
	rid: string;
	tmid?: string;
	uid: string;
	username: string;
	ts: number;
	updatedAt: number;
	kind: E2EESearchDocKind;
	body: string;
};

export type E2EESearchQuery = {
	text: string;
	rid?: string;
	uid?: string;
	from?: number;
	to?: number;
	order?: 'relevance' | 'recent';
	limit?: number;
};

export type E2EESearchHit = {
	id: string;
	rid: string;
	tmid?: string;
	uid: string;
	username: string;
	ts: number;
	/** Escaped message text with only added `<mark>` tags. */
	snippet: string;
};

export type E2EESearchRecentCursor = {
	ts: number;
	id: string;
};

export type E2EESearchRecentQuery = Omit<E2EESearchQuery, 'order'> & {
	cursor?: E2EESearchRecentCursor;
};

export type E2EESearchRecentPage = {
	hits: E2EESearchHit[];
	nextCursor?: E2EESearchRecentCursor;
};

export type E2EESearchIndexEvent = { type: 'lost' } | { type: 'changed' };

export type E2EESearchCapabilities = {
	recentCursor: 1;
	lifecycleEvents: 1;
	close: 1;
};

export type E2EESearchRoomState = {
	lastUpdate?: number;
	backfillCursor?: string;
	backfillDone: boolean;
};

export type E2EESearchStats = { docs: number; bytes: number; rooms: number };

export type E2EESearchOpenResult = {
	schemaVersion: number;
	encryptedAtRest: boolean;
	/** A locked open creates no index and writes nothing. */
	locked?: true;
	/** Announce these capabilities only when every corresponding method is available. */
	capabilities?: E2EESearchCapabilities;
};

export type E2EESearchScope = {
	userId: string;
	/** A 32-byte derived key, not the user's E2EE private key. */
	wrapKey?: Uint8Array;
};

export interface ISearchIndexBackend {
	open(scope: E2EESearchScope): Promise<E2EESearchOpenResult>;
	upsert(docs: E2EESearchDoc[]): Promise<void>;
	remove(ids: string[]): Promise<void>;
	removeRoom(rid: string): Promise<void>;
	listRooms(): Promise<string[]>;
	search(query: E2EESearchQuery): Promise<E2EESearchHit[]>;
	/** Recent hits use descending timestamp and binary ID order. A cursor continues strictly after the last returned hit. */
	searchRecentPage?(query: E2EESearchRecentQuery): Promise<E2EESearchRecentPage>;
	/** Events belong to the open session that registered the listener. The return value unsubscribes the listener. */
	onIndexEvent?(listener: (event: E2EESearchIndexEvent) => void): () => void;
	getRoomState(rid: string): Promise<E2EESearchRoomState | undefined>;
	setRoomState(rid: string, state: E2EESearchRoomState): Promise<void>;
	stats(): Promise<E2EESearchStats>;
	wipe(scope?: { userId: string }): Promise<void>;
	/** End active access without implying deletion or a retention policy. */
	close?(): Promise<void>;
}
