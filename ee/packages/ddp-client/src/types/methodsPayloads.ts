/**
 * @category outgoing
 */
export type MethodPayload = {
	msg: 'method';
	/** method name */
	method: string;
	/** EJSON parameters to the method */
	params: any[];
	/** an arbitrary client-determined identifier for this method call */
	id: string;
	/** an arbitrary client-determined seed for pseudo-random generators */
	randomSeed?: Record<string, unknown>;
};

/**
 * @category incoming
 */
export type ResultPayload = {
	msg: 'result';
	/** the id passed to `'method'` */
	id: string;
	/** an error thrown by the method (or method-not-found) */
	error?: unknown;
	/** the EJSON return value of the method, if any */
	result?: any;
};

/**
 * @category incoming
 */
export type UpdatedPayload = {
	msg: 'updated';
	/** array of method ids; all of whose writes have been reflected in data messages */
	methods: string[];
};

/**
 * @category outgoing
 */
export type ClientMethodPayloads = MethodPayload;

/**
 * @category incoming
 */
export type ServerMethodPayloads = ResultPayload | UpdatedPayload;
