/**
 * @category outgoing
 */
export type SubscribePayload = {
	msg: 'sub';
	/** an arbitrary client-determined identifier for this subscription */
	id: string;
	/** the name of the subscription */
	name: string;
	/** parameters to the subscription */
	params?: any[];
};

/**
 * @category outgoing
 */
export type UnsubscribePayload = {
	msg: 'unsub';
	/** the id passed to `'sub'` */
	id: string;
};

/**
 * @category outgoing
 */
export type ClientPublicationPayloads = SubscribePayload | UnsubscribePayload;

/**
 * @category incoming
 */
export type NosubPayload = {
	msg: 'nosub';
	/** the id passed to `'sub'` */
	id: string;
	/** an error thrown by the subscription (or sub-not-found) */
	error?: unknown;
};

/**
 * @category incoming
 */
export type AddedPayload = {
	msg: 'added';
	/** the name of the collection */
	collection: string;
	/** the document ID */
	id: string;
	/** the document fields */
	fields?: Record<string, any>;
};

/**
 * @category incoming
 */
export type ChangedPayload = {
	msg: 'changed';
	/** the name of the collection */
	collection: string;
	/** the document ID */
	id: string;
	/** the document fields */
	fields?: Record<string, any>;
	/** the document fields to delete */
	cleared?: string[];
};

/**
 * @category incoming
 */
export type RemovedPayload = {
	msg: 'removed';
	/** the name of the collection */
	collection: string;
	/** the document ID */
	id: string;
};

/**
 * @category incoming
 */
export type ReadyPayload = {
	msg: 'ready';
	/** the ids passed to `'sub'` which have sent their initial batch of data */
	subs: string[];
};

/**
 * @category incoming
 */
export type AddedBeforePayload = {
	msg: 'addedBefore';
	/** the name of the collection */
	collection: string;
	/** the document ID */
	id: string;
	/** the document fields */
	fields?: Record<string, any>;
	/** the document ID to add the document before, or `null` to add at the end */
	before: string | null;
};

// movedBefore (server -> client):
//  collection: string
//  id: string (the document ID)
//  before: string or null (the document ID to move the document before, or null to move to the end)

/**
 * @category incoming
 */
export type MovedBeforePayload = {
	msg: 'movedBefore';
	/** the name of the collection */
	collection: string;
	/** the document ID */
	id: string;
	/** the document ID to move the document before, or `null` to move to the end */
	before: string | null;
};

/**
 * @category incoming
 */
export type ServerPublicationPayloads =
	| NosubPayload
	| AddedPayload
	| ChangedPayload
	| RemovedPayload
	| ReadyPayload
	| AddedBeforePayload
	| MovedBeforePayload;

export type PublicationPayloads = AddedPayload | ChangedPayload | RemovedPayload;
