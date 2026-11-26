import type { Defined } from './jsonrpc';

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

/** The log entries that the subprocess collected for the call that failed. */
type WithLogs = { logs?: object };

/** The standard codes carry the context of the failure, if any, in `detail`. */
type StandardErrorData = WithLogs & { detail?: Defined };

/** What `error.data` holds for each code. A raw `Error` is never a member. */
export type ErrorDataByCode = {
	[ErrorCode.PARSE_ERROR]: StandardErrorData;
	[ErrorCode.INVALID_REQUEST]: StandardErrorData;
	[ErrorCode.METHOD_NOT_FOUND]: StandardErrorData;
	[ErrorCode.INVALID_PARAMS]: StandardErrorData;
	[ErrorCode.INTERNAL_ERROR]: StandardErrorData;
	[ErrorCode.SERVER_ERROR]: WithLogs & { name?: string; stack?: string };
	[ErrorCode.PROCEDURE_ERROR]: WithLogs & { name: string; data: Defined };
	[ErrorCode.APPS_ENGINE_EXCEPTION]: WithLogs & { name: string };
};

export type ErrorData<C extends ErrorCode> = ErrorDataByCode[C];

/** Keeps the identity of a thrown `Error` in the shape of `SERVER_ERROR`, in place of the `Error` itself. */
export const toServerErrorData = ({ name, stack }: Error): ErrorData<typeof ErrorCode.SERVER_ERROR> => ({ name, stack });
