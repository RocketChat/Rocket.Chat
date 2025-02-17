# JSON-RPC lite

Parse and Serialize JSON-RPC2 messages in node.js or browser.

Inspired by https://github.com/soggie/jsonrpc-serializer

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads][downloads-image]][downloads-url]

**A implementation of [JSON-RPC 2.0 specifications](http://jsonrpc.org/specification)**

## Install

```sh
npm install jsonrpc-lite
```

## API

```js
const jsonrpc = require('jsonrpc-lite')
```

### jsonrpc.request(id, method[, params])

Creates a JSON-RPC 2.0 request object, return JsonRpc object.

- `id`: {String|Integer}
- `method`: {String}
- `params`:  {Object|Array}, optional

```js
const requestObj = jsonrpc.request('123', 'update', {list: [1, 2, 3]})
// {
//   jsonrpc: '2.0',
//   id: '123',
//   method: 'update',
//   params: {list: [1, 2, 3]}
// }
```

### jsonrpc.notification(method[, params])

Creates a JSON-RPC 2.0 notification object, return JsonRpc object.

- `method`: {String}
- `params`:  {Object|Array}, optional

```js
const notificationObj = jsonrpc.notification('update', {list: [1, 2, 3]})
// {
//   jsonrpc: '2.0',
//   method: 'update',
//   params: {list: [1, 2, 3]}
// }
```

### jsonrpc.success(id, result)

Creates a JSON-RPC 2.0 success response object, return JsonRpc object.

- `id`: {String|Integer}
- `result`:  {Mixed}

```js
const successObj = jsonrpc.success('123', 'OK')
// {
//   jsonrpc: '2.0',
//   id: '123',
//   result: 'OK',
// }
```

### jsonrpc.error(id, error)

Creates a JSON-RPC 2.0 error response object, return JsonRpc object.

- `id`: {String|Integer}
- `error`: {JsonRpcError}

```js
const errorObj = jsonrpc.error('123', new jsonrpc.JsonRpcError('some error', 99))
// {
//   jsonrpc: '2.0',
//   id: '123',
//   error: {code: 99, 'message': 'some error'},
// }
```

### jsonrpc.parse(message)

Takes a JSON-RPC 2.0 payload (string) and tries to parse it into a JSON. If successful, determine what object is it (response, notification, success, error, or invalid), and return it's type and properly formatted object.

- `message`: {String}

return an array, or an object of this format:

**single parsed request:**

```js
{
  type: 'request',
  payload: {
    jsonrpc: '2.0',
    id: 123,
    method: 'update',
    params: {}
  }
}
```

**batch parsed result:**

```js
[{
  type: 'request',
  payload: {
    jsonrpc: '2.0',
    id: '123',
    method: 'update',
    params: [1, 2, 3]
  }
}, {
  type: 'notification',
  payload: {
    jsonrpc: '2.0',
    method: 'update',
    params: {_id: 'xxx'}
  }
}, {
  type: 'success',
  payload: {
    jsonrpc: '2.0',
    id: '123',
    result: 'OK'
  }
}, {
  type: 'error',
  payload: {
    jsonrpc: '2.0',
    id: '123',
    error: [jsonrpc.JsonRpcError object]
  }
}, {
  type: 'invalid',
  payload: [jsonrpc.JsonRpcError object]
}]
```

### jsonrpc.parseObject(message)

Takes a JSON-RPC 2.0 payload (Object) and tries to parse it into a JSON. If successful, determine what object is it (response, notification, success, error, or invalid), and return it's type and properly formatted object.

- `message`: {Object}

return an `JsonRpcParsed` object with `type` and `payload`.

### Class: jsonrpc.JsonRpc()

### Class: jsonrpc.JsonRpcError(message, code[, data])

Create a JsonRpcError instance.

- `message`:  {String}
- `code`:  {Integer}
- `data`: {Mixed} optional

```js
const error = new jsonrpc.JsonRpcError('some error', 999)
```

### Class Method: jsonrpc.JsonRpcError.invalidRequest([data])

### Class Method: jsonrpc.JsonRpcError.methodNotFound([data])

### Class Method: jsonrpc.JsonRpcError.invalidParams([data])

### Class Method: jsonrpc.JsonRpcError.internalError([data])

### Class Method: jsonrpc.JsonRpcError.parseError([data])

[npm-url]: https://npmjs.org/package/jsonrpc-lite
[npm-image]: http://img.shields.io/npm/v/jsonrpc-lite.svg

[travis-url]: https://travis-ci.org/teambition/jsonrpc-lite
[travis-image]: http://img.shields.io/travis/teambition/jsonrpc-lite.svg

[downloads-url]: https://npmjs.org/package/jsonrpc-lite
[downloads-image]: http://img.shields.io/npm/dm/jsonrpc-lite.svg?style=flat-square
