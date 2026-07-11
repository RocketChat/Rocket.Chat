/**
 * Host↔worker contract: JSON-RPC 2.0 over the worker-thread channel (decision 0005 §4). Today the
 * host is the caller (`load`, `dispatch`); the same channel will later carry worker→host `ctx`
 * capability calls (0005 §4, symmetry note).
 */
import type { Decision, EventName, EventPayloads, Registration } from '@rocket.chat/apps-sdk';

export type JsonRpcId = number | string;

export type JsonRpcRequest<M extends string = string, P = unknown> = {
	jsonrpc: '2.0';
	id: JsonRpcId;
	method: M;
	params: P;
};

export type JsonRpcNotification<M extends string = string, P = unknown> = {
	jsonrpc: '2.0';
	method: M;
	params?: P;
};

export type JsonRpcSuccess<R = unknown> = {
	jsonrpc: '2.0';
	id: JsonRpcId;
	result: R;
};

export type JsonRpcErrorBody = {
	code: number;
	message: string;
	data?: unknown;
};

export type JsonRpcFailure = {
	jsonrpc: '2.0';
	id: JsonRpcId | null;
	error: JsonRpcErrorBody;
};

export type JsonRpcResponse<R = unknown> = JsonRpcSuccess<R> | JsonRpcFailure;
export type JsonRpcMessage = JsonRpcRequest | JsonRpcNotification | JsonRpcResponse;

/** Reserved JSON-RPC range (-32768..-32000) for standard errors; -32000+ for ours. */
export enum RpcErrorCode {
	ParseError = -32700,
	InvalidRequest = -32600,
	MethodNotFound = -32601,
	InvalidParams = -32602,
	InternalError = -32603,
	// app-runtime specific
	LoadFailed = -32000,
	BrandInvalid = -32001,
	HandlerThrew = -32002,
	NoHandler = -32003,
}

// --- method: load ---
export type LoadParams = Record<string, never>;
export type LoadResult = {
	registrations: readonly Registration[];
};

// --- method: dispatch ---
export type DispatchParams<E extends EventName = EventName> = {
	event: { name: E; payload: EventPayloads[E] };
};

export type DispatchResult = {
	decision: Decision;
};

// --- notification: fault (out-of-band failure with no in-flight request) ---
export type FaultParams = {
	message: string;
	stack?: string;
};

export function isResponse(msg: JsonRpcMessage): msg is JsonRpcResponse {
	return 'id' in msg && msg.id !== undefined && ('result' in msg || 'error' in msg);
}

export function isFailure(msg: JsonRpcResponse): msg is JsonRpcFailure {
	return 'error' in msg;
}
