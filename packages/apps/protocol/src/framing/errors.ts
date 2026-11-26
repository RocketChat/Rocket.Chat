/**
 * The closed set of error codes that cross the host/subprocess boundary. A call site
 * names one of these; it never writes a bare number.
 */
export const ErrorCode = {
	PARSE_ERROR: -32700,
	INVALID_REQUEST: -32600,
	METHOD_NOT_FOUND: -32601,
	INVALID_PARAMS: -32602,
	INTERNAL_ERROR: -32603,
	/** A handler or a bridge threw. */
	SERVER_ERROR: -32000,
	/** A procedure threw one of its declared errors. */
	PROCEDURE_ERROR: -32001,
	/** An app threw an `AppsEngineException`; equals `AppsEngineException.JSONRPC_ERROR_CODE`. */
	APPS_ENGINE_EXCEPTION: -32070,
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
