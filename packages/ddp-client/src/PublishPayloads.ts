// Managing Data:
// Messages:

// sub (client -> server):
//  id: string (an arbitrary client-determined identifier for this subscription)
//  name: string (the name of the subscription)
//  params: optional array of EJSON items (parameters to the subscription)

export type SubscribePayload = {
	msg: 'sub';
	id: string;
	name: string;
	params: any[];
};

// unsub (client -> server):
//  id: string (the id passed to 'sub')
export type UnsubscribePayload = {
	msg: 'unsub';
	id: string;
};

export type ClientPublicationPayloads = SubscribePayload | UnsubscribePayload;
// nosub (server -> client):
//  id: string (the id passed to 'sub')
//  error: optional Error (an error raised by the subscription as it concludes, or sub-not-found)

export type NosubPayload = {
	msg: 'nosub';
	id: string;
	error?: string;
};

// added (server -> client):
//  collection: string (collection name)
//  id: string (document ID)
//  fields: optional object with EJSON values

export type AddedPayload = {
	msg: 'added';
	collection: string;
	id: string;
	fields: Record<string, any>;
};

// changed (server -> client):
//  collection: string (collection name)
//  id: string (document ID)
//  fields: optional object with EJSON values
//  cleared: optional array of strings (field names to delete)

export type ChangedPayload = {
	msg: 'changed';
	collection: string;
	id: string;
	fields: Record<string, any>;
	cleared?: string[];
};

// removed (server -> client):
//  collection: string (collection name)
//  id: string (document ID)

export type RemovedPayload = {
	msg: 'removed';
	collection: string;
	id: string;
};
//  ready (server -> client):
//  subs: array of strings (ids passed to 'sub' which have sent their initial batch of data)

export type ReadyPayload = {
	msg: 'ready';
	subs: string[];
};

// addedBefore (server -> client):
//  collection: string (collection name)
//  id: string (document ID)
//  fields: optional object with EJSON values
//  before: string or null (the document ID to add the document before, or null to add at the end)

export type AddedBeforePayload = {
	msg: 'addedBefore';
	collection: string;
	id: string;
	fields: Record<string, any>;
	before: string | null;
};

// movedBefore (server -> client):
//  collection: string
//  id: string (the document ID)
//  before: string or null (the document ID to move the document before, or null to move to the end)

export type MovedBeforePayload = {
	msg: 'movedBefore';
	collection: string;
	id: string;
	before: string | null;
};

export type ServerPublicationPayloads =
	| NosubPayload
	| AddedPayload
	| ChangedPayload
	| RemovedPayload
	| ReadyPayload
	| AddedBeforePayload
	| MovedBeforePayload;
