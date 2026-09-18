// **Github:** https://github.com/teambition/jsonrpc-lite
//
// http://www.jsonrpc.org/specification
// **License:** MIT
'use strict'

export type ID = string | number | null
export type Defined = string | number | boolean | object | null
export type RpcParams = object | Defined[]

const hasOwnProperty = Object.prototype.hasOwnProperty
const isInteger: (num: number) => boolean = typeof Number.isSafeInteger === 'function'
  ? Number.isSafeInteger // ECMAScript 2015
  : function (num) {
    return typeof num === 'number' && isFinite(num) && num === Math.floor(num) && Math.abs(num) <= 9007199254740991
  }

/**
 * JsonRpc Class
 *
 * @return {Object} JsonRpc object
 * @api public
 */
export interface IJsonRpcType {
  readonly jsonrpc: string
}

export class JsonRpc implements IJsonRpcType {
  static VERSION: string = '2.0'
  readonly jsonrpc: string

  constructor () {
    this.jsonrpc = '2.0'
  }

  serialize () {
    return JSON.stringify(this)
  }

}

export class RequestObject extends JsonRpc {
  public id: ID
  public method: string
  public params?: RpcParams
  constructor (id: ID, method: string, params?: RpcParams) {
    super()
    this.id = id
    this.method = method
    if (params !== undefined ) {
      this.params = params
    }
  }
}

export class NotificationObject extends JsonRpc {
  public method: string
  public params?: RpcParams
  constructor (method: string, params?: RpcParams) {
    super()
    this.method = method
    if (params !== undefined ) {
      this.params = params
    }
  }
}

export class SuccessObject extends JsonRpc {
  public id: ID
  public result: Defined
  constructor (id: ID, result: Defined) {
    super()
    this.id = id
    this.result = result
  }
}

export class ErrorObject extends JsonRpc {
  // tslint:disable-next-line:no-shadowed-variable
  constructor (public id: ID, public error: JsonRpcError) {
    super()
    this.id = id
    this.error = error
  }
}

/**
 * JsonRpcParsed Class
 *
 * @param  {JsonRpc|JsonRpcError} payload
 * @param  {type: <Enum, 'request'|'notification'|'success'|'error'|'invalid'>} type
 * @api public
 */
export const enum RpcStatusType {
  request = 'request',
  notification = 'notification',
  success = 'success',
  error = 'error',
  invalid = 'invalid',
}

export class JsonRpcParsed {
  constructor (
    public payload: JsonRpc | JsonRpcError,
    public type: RpcStatusType,
  ) {
    this.payload = payload
    this.type = type
  }
}

/**
 * JsonRpcError Class
 *
 * @param  {String} message
 * @param  {Integer} code
 * @return {String} name: optional
 * @api public
 */
export class JsonRpcError {
  static invalidRequest = function (data: any): JsonRpcError {
    return new JsonRpcError('Invalid request', -32600, data)
  }

  static methodNotFound = function (data: any): JsonRpcError {
    return new JsonRpcError('Method not found', -32601, data)
  }

  static invalidParams = function (data: any): JsonRpcError {
    return new JsonRpcError('Invalid params', -32602, data)
  }

  static internalError = function (data: any): JsonRpcError {
    return new JsonRpcError('Internal error', -32603, data)
  }

  static parseError = function (data: any): JsonRpcError {
    return new JsonRpcError('Parse error', -32700, data)
  }

  public message: string
  public code: number
  public data?: any
  constructor (message: string, code: number, data?: any) {
    this.message = message
    this.code = isInteger(code) ? code : 0
    if (data != null ) {
      this.data = data
    }
  }
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
export function request (
  id: ID,
  method: string,
  params?: RpcParams,
): RequestObject {
  const object = new RequestObject(id, method, params)
  validateMessage(object, true)
  return object
}

/**
 * Creates a JSON-RPC 2.0 notification object
 *
 * @param  {String} method
 * @param  {Object|Array} [params]: optional
 * @return {Object} JsonRpc object
 * @api public
 */
export function notification (
  method: string,
  params?: RpcParams,
): NotificationObject {
  const object = new NotificationObject(method, params)
  validateMessage(object, true)
  return object
}

/**
 * Creates a JSON-RPC 2.0 success response object
 *
 * @param  {String|Integer} id
 * @param  {Mixed} result
 * @return {Object} JsonRpc object
 * @api public
 */
export function success (id: ID, result: Defined): SuccessObject {
  const object = new SuccessObject(id, result)
  validateMessage(object, true)
  return object
}

/**
 * Creates a JSON-RPC 2.0 error response object
 *
 * @param  {String|Integer} id
 * @param  {Object} JsonRpcError error
 * @return {Object} JsonRpc object
 * @api public
 */
export function error (id: ID, err: JsonRpcError): ErrorObject {
  const object = new ErrorObject(id, err)
  validateMessage(object, true)
  return object
}

export interface IParsedObjectSuccess {
  type: RpcStatusType.success,
  payload: SuccessObject
}

export interface IParsedObjectNotification {
  type: RpcStatusType.notification,
  payload: NotificationObject
}

export interface IParsedObjectRequest {
  type: RpcStatusType.request,
  payload: RequestObject
}

export interface IParsedObjectError {
  type: RpcStatusType.error,
  payload: ErrorObject
}

export interface IParsedObjectInvalid {
  type: RpcStatusType.invalid,
  payload: JsonRpcError
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
export type IParsedObject = IParsedObjectSuccess | IParsedObjectNotification |
  IParsedObjectRequest | IParsedObjectError| IParsedObjectInvalid;

export function parse (
  message: string,
): IParsedObject | IParsedObject[] {
  if (!isString(message)) {
    return new JsonRpcParsed(
      JsonRpcError.invalidRequest(message),
      RpcStatusType.invalid,
    ) as IParsedObject
  }

  let jsonrpcObj: JsonRpc | JsonRpc[]
  try {
    jsonrpcObj = JSON.parse(message)
  } catch (err) {
    return new JsonRpcParsed(
      JsonRpcError.parseError(message),
      RpcStatusType.invalid,
    ) as IParsedObject
  }

  return parseJsonRpcObject(jsonrpcObj)
}

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
export function parseJsonRpcObject (jsonrpcObj: JsonRpc | JsonRpc[]): IParsedObject | IParsedObject[] {
  if (!Array.isArray(jsonrpcObj)) {
    return parseObject(jsonrpcObj)
  }

  if (jsonrpcObj.length === 0) {
    return new JsonRpcParsed(
      JsonRpcError.invalidRequest(jsonrpcObj),
      RpcStatusType.invalid,
    ) as IParsedObject
  }

  const parsedObjectArray: IParsedObject[] = []
  for (let i = 0, len = jsonrpcObj.length; i < len; i++) {
    parsedObjectArray[i] = parseObject(jsonrpcObj[i])
  }

  return parsedObjectArray
}

/**
 * Alias for `parse` method.
 * Takes a JSON-RPC 2.0 payload (String) and tries to parse it into a JSON.
 * @api public
 */
export const parseJsonRpcString = parse

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
export function parseObject (obj: any): IParsedObject {
  let err: JsonRpcError | null = null
  let payload: JsonRpc | JsonRpcError | null = null
  let payloadType: RpcStatusType = RpcStatusType.invalid

  if (obj == null || obj.jsonrpc !== JsonRpc.VERSION) {
    err = JsonRpcError.invalidRequest(obj)
    payloadType = RpcStatusType.invalid
  } else if (!hasOwnProperty.call(obj, 'id')) {
    const tmp = obj as NotificationObject
    payload = new NotificationObject(tmp.method, tmp.params)
    err = validateMessage(payload)
    payloadType = RpcStatusType.notification
  } else if (hasOwnProperty.call(obj, 'method')) {
    const tmp = obj as RequestObject
    payload = new RequestObject(tmp.id, tmp.method, tmp.params)
    err = validateMessage(payload)
    payloadType = RpcStatusType.request
  } else if (hasOwnProperty.call(obj, 'result')) {
    const tmp = obj as SuccessObject
    payload = new SuccessObject(tmp.id, tmp.result)
    err = validateMessage(payload)
    payloadType = RpcStatusType.success
  } else if (hasOwnProperty.call(obj, 'error')) {
    const tmp = obj as ErrorObject
    payloadType = RpcStatusType.error
    if (tmp.error == null) {
      err = JsonRpcError.internalError(tmp)
    } else {
      const errorObj = new JsonRpcError(
        tmp.error.message,
        tmp.error.code,
        tmp.error.data,
      )
      if (errorObj.message !== tmp.error.message || errorObj.code !== tmp.error.code) {
        err = JsonRpcError.internalError(tmp)
      } else {
        payload = new ErrorObject(tmp.id, errorObj)
        err = validateMessage(payload)
      }
    }
  }

  if (err == null && payload != null) {
    return new JsonRpcParsed(payload, payloadType) as IParsedObject
  }
  return new JsonRpcParsed(
    err != null ? err : JsonRpcError.invalidRequest(obj),
    RpcStatusType.invalid,
  ) as IParsedObject
}

// if error, return error, else return null
function validateMessage (obj: JsonRpc, throwIt?: boolean): JsonRpcError | null {
  let err: JsonRpcError | null = null
  if (obj instanceof RequestObject) {
    err = checkId(obj.id)
    if (err == null) {
      err = checkMethod(obj.method)
    }
    if (err == null) {
      err = checkParams(obj.params)
    }
  } else if (obj instanceof NotificationObject) {
    err = checkMethod(obj.method)
    if (err == null) {
      err = checkParams(obj.params)
    }
  } else if (obj instanceof SuccessObject) {
    err = checkId(obj.id)
    if (err == null) {
      err = checkResult(obj.result)
    }
  } else if (obj instanceof ErrorObject) {
    err = checkId(obj.id, true)
    if (err == null) {
      err = checkError(obj.error as JsonRpcError)
    }
  }
  if (throwIt && err != null) {
    throw err
  }
  return err
}

function checkId (id: ID, maybeNull?: boolean): JsonRpcError | null {
  if (maybeNull && id === null) {
    return null
   }
  return isString(id) || isInteger(id as number)
    ? null
    : JsonRpcError.internalError('"id" must be provided, a string or an integer.')
}

function checkMethod (method: string): JsonRpcError | null {
  return isString(method) ? null : JsonRpcError.invalidRequest(method)
}

function checkResult (result: Defined): JsonRpcError | null {
  return result === undefined
    ? JsonRpcError.internalError('Result must exist for success Response objects')
    : null
}

function checkParams (params?: RpcParams): JsonRpcError | null {
  if (params === undefined) {
    return null
  }
  if (Array.isArray(params) || isObject(params)) {
    // ensure params can be stringify
    try {
      JSON.stringify(params)
      return null
    } catch (err) {
      return JsonRpcError.parseError(params)
    }
  }
  return JsonRpcError.invalidParams(params)
}

function checkError (err: JsonRpcError): JsonRpcError | null {
  if (!(err instanceof JsonRpcError)) {
    return JsonRpcError.internalError('Error must be an instance of JsonRpcError')
  }

  if (!isInteger(err.code)) {
    return JsonRpcError.internalError('Invalid error code. It must be an integer.')
  }

  if (!isString(err.message)) {
    return JsonRpcError.internalError('Message must exist or must be a string.')
  }

  return null
}

function isString (obj: any): boolean {
  return obj !== '' && typeof obj === 'string'
}

function isObject (obj: any): boolean {
  return obj != null && typeof obj === 'object' && !Array.isArray(obj)
}

const jsonrpc = {
  JsonRpc,
  JsonRpcError,
  request,
  notification,
  success,
  error,
  parse,
  parseObject,
  parseJsonRpcObject,
  parseJsonRpcString,
}

export default jsonrpc
export { jsonrpc }
