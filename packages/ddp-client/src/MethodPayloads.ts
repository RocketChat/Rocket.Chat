// method (client -> server):
//  method: string (method name)
//  params: optional array of EJSON items (parameters to the method)
//  id: string (an arbitrary client-determined identifier for this method call)
//  randomSeed: optional JSON value (an arbitrary client-determined seed for pseudo-random generators)

export type MethodPayload = {
	msg: 'method';
	method: string;
	params: any[];
	id: string;
	randomSeed?: Record<string, unknown>;
};

// result (server -> client):
//  id: string (the id passed to 'method')
//  error: optional Error (an error thrown by the method (or method-not-found)
//  result: optional EJSON item (the return value of the method, if any)

export type ResultPayload = {
	msg: 'result';
	id: string;
	error?: string;
	result?: any;
};

// updated (server -> client):
//  methods: array of strings (ids passed to 'method', all of whose writes have been reflected in data messages)

export type UpdatedPayload = {
	msg: 'updated';
	methods: string[];
};

export type ClientMethodPayloads = MethodPayload;

export type ServerMethodPayloads = ResultPayload | UpdatedPayload;
