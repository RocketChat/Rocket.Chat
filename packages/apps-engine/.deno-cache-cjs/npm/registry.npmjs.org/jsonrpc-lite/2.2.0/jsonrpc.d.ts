export declare type ID = string | number | null;
export declare type Defined = string | number | boolean | object | null;
export declare type RpcParams = object | Defined[];
/**
 * JsonRpc Class
 *
 * @return {Object} JsonRpc object
 * @api public
 */
export interface IJsonRpcType {
    readonly jsonrpc: string;
}
export declare class JsonRpc implements IJsonRpcType {
    static VERSION: string;
    readonly jsonrpc: string;
    constructor();
    serialize(): string;
}
export declare class RequestObject extends JsonRpc {
    id: ID;
    method: string;
    params?: RpcParams;
    constructor(id: ID, method: string, params?: RpcParams);
}
export declare class NotificationObject extends JsonRpc {
    method: string;
    params?: RpcParams;
    constructor(method: string, params?: RpcParams);
}
export declare class SuccessObject extends JsonRpc {
    id: ID;
    result: Defined;
    constructor(id: ID, result: Defined);
}
export declare class ErrorObject extends JsonRpc {
    id: ID;
    error: JsonRpcError;
    constructor(id: ID, error: JsonRpcError);
}
/**
 * JsonRpcParsed Class
 *
 * @param  {JsonRpc|JsonRpcError} payload
 * @param  {type: <Enum, 'request'|'notification'|'success'|'error'|'invalid'>} type
 * @api public
 */
export declare const enum RpcStatusType {
    request = "request",
    notification = "notification",
    success = "success",
    error = "error",
    invalid = "invalid"
}
export declare class JsonRpcParsed {
    payload: JsonRpc | JsonRpcError;
    type: RpcStatusType;
    constructor(payload: JsonRpc | JsonRpcError, type: RpcStatusType);
}
/**
 * JsonRpcError Class
 *
 * @param  {String} message
 * @param  {Integer} code
 * @return {String} name: optional
 * @api public
 */
export declare class JsonRpcError {
    static invalidRequest: (data: any) => JsonRpcError;
    static methodNotFound: (data: any) => JsonRpcError;
    static invalidParams: (data: any) => JsonRpcError;
    static internalError: (data: any) => JsonRpcError;
    static parseError: (data: any) => JsonRpcError;
    message: string;
    code: number;
    data?: any;
    constructor(message: string, code: number, data?: any);
}
/**
 * Creates a JSON-RPC 2.0 request object
 *
 * @param  {String|Integer} id
 * @param  {String} method
 * @param  {Object|Array} [params]: optional
 * @return {Object} JsonRpc object
 * @api public
 */
export declare function request(id: ID, method: string, params?: RpcParams): RequestObject;
/**
 * Creates a JSON-RPC 2.0 notification object
 *
 * @param  {String} method
 * @param  {Object|Array} [params]: optional
 * @return {Object} JsonRpc object
 * @api public
 */
export declare function notification(method: string, params?: RpcParams): NotificationObject;
/**
 * Creates a JSON-RPC 2.0 success response object
 *
 * @param  {String|Integer} id
 * @param  {Mixed} result
 * @return {Object} JsonRpc object
 * @api public
 */
export declare function success(id: ID, result: Defined): SuccessObject;
/**
 * Creates a JSON-RPC 2.0 error response object
 *
 * @param  {String|Integer} id
 * @param  {Object} JsonRpcError error
 * @return {Object} JsonRpc object
 * @api public
 */
export declare function error(id: ID, err: JsonRpcError): ErrorObject;
export interface IParsedObjectSuccess {
    type: RpcStatusType.success;
    payload: SuccessObject;
}
export interface IParsedObjectNotification {
    type: RpcStatusType.notification;
    payload: NotificationObject;
}
export interface IParsedObjectRequest {
    type: RpcStatusType.request;
    payload: RequestObject;
}
export interface IParsedObjectError {
    type: RpcStatusType.error;
    payload: ErrorObject;
}
export interface IParsedObjectInvalid {
    type: RpcStatusType.invalid;
    payload: JsonRpcError;
}
/**
 * Takes a JSON-RPC 2.0 payload (String) and tries to parse it into a JSON.
 * If successful, determine what object is it (response, notification,
 * success, error, or invalid), and return it's type and properly formatted object.
 *
 * @param  {String} msg
 * @return {Object|Array} an array, or an object of this format:
 *
 *  {
 *    type: <Enum, 'request'|'notification'|'success'|'error'|'invalid'>
 *    payload: <JsonRpc|JsonRpcError>
 *  }
 *
 * @api public
 */
export declare type IParsedObject = IParsedObjectSuccess | IParsedObjectNotification | IParsedObjectRequest | IParsedObjectError | IParsedObjectInvalid;
export declare function parse(message: string): IParsedObject | IParsedObject[];
/**
 * Takes a JSON-RPC 2.0 payload (Object) or batch (Object[]) and tries to parse it.
 * If successful, determine what objects are inside (response, notification,
 * success, error, or invalid), and return their types and properly formatted objects.
 *
 * @param  {Object|Array} jsonrpcObj
 * @return {Object|Array} a single object or an array of `JsonRpcParsed` objects with `type` and `payload`:
 *
 *  {
 *    type: <Enum, 'request'|'notification'|'success'|'error'|'invalid'>
 *    payload: <JsonRpc|JsonRpcError>
 *  }
 *
 * @api public
 */
export declare function parseJsonRpcObject(jsonrpcObj: JsonRpc | JsonRpc[]): IParsedObject | IParsedObject[];
/**
 * Alias for `parse` method.
 * Takes a JSON-RPC 2.0 payload (String) and tries to parse it into a JSON.
 * @api public
 */
export declare const parseJsonRpcString: typeof parse;
/**
 * Takes a JSON-RPC 2.0 payload (Object) and tries to parse it into a JSON.
 * If successful, determine what object is it (response, notification,
 * success, error, or invalid), and return it's type and properly formatted object.
 *
 * @param  {Object} obj
 * @return {Object} an `JsonRpcParsed` object with `type` and `payload`:
 *
 *  {
 *    type: <Enum, 'request'|'notification'|'success'|'error'|'invalid'>
 *    payload: <JsonRpc|JsonRpcError>
 *  }
 *
 * @api public
 */
export declare function parseObject(obj: any): IParsedObject;
declare const jsonrpc: {
    JsonRpc: typeof JsonRpc;
    JsonRpcError: typeof JsonRpcError;
    request: typeof request;
    notification: typeof notification;
    success: typeof success;
    error: typeof error;
    parse: typeof parse;
    parseObject: typeof parseObject;
    parseJsonRpcObject: typeof parseJsonRpcObject;
    parseJsonRpcString: typeof parse;
};
export default jsonrpc;
export { jsonrpc };
