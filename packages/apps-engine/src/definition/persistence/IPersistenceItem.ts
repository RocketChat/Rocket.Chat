import type { RocketChatAssociationRecord } from '../metadata';

/**
 * A record in an App's private store, as `IPersistenceRead` returns it.
 *
 * The store is per App: one App never sees another's items.
 */
export interface IPersistenceItem {
	/** The App that owns this record. */
	appId: string;
	/** Whatever the App stored. */
	data: Record<string, unknown>;
	/** The Rocket.Chat records this data is filed under, used to look it up again. */
	associations?: Array<RocketChatAssociationRecord>;
}
