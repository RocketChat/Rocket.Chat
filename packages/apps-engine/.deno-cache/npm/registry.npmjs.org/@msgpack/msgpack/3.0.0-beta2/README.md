# MessagePack for JavaScript/ECMA-262  <!-- omit in toc -->

[![npm version](https://img.shields.io/npm/v/@msgpack/msgpack.svg)](https://www.npmjs.com/package/@msgpack/msgpack) ![CI](https://github.com/msgpack/msgpack-javascript/workflows/CI/badge.svg) [![codecov](https://codecov.io/gh/msgpack/msgpack-javascript/branch/master/graphs/badge.svg)](https://codecov.io/gh/msgpack/msgpack-javascript) [![minzip](https://badgen.net/bundlephobia/minzip/@msgpack/msgpack)](https://bundlephobia.com/result?p=@msgpack/msgpack) [![tree-shaking](https://badgen.net/bundlephobia/tree-shaking/@msgpack/msgpack)](https://bundlephobia.com/result?p=@msgpack/msgpack)

This library is an implementation of **MessagePack** for TypeScript and JavaScript, providing a compact and efficient binary serialization format. Learn more about MessagePack at:

https://msgpack.org/

This library serves as a comprehensive reference implementation of MessagePack for JavaScript with a focus on accuracy, compatibility, interoperability, and performance.

Additionally, this is also a universal JavaScript library. It is compatible not only with browsers, but with Node.js or other JavaScript engines that implement ES2015+ standards. As it is written in [TypeScript](https://www.typescriptlang.org/), this library bundles up-to-date type definition files (`d.ts`).

*Note that this is the second edition of "MessagePack for JavaScript". The first edition, which was implemented in ES5 and never released to npmjs.com, is tagged as [`classic`](https://github.com/msgpack/msgpack-javascript/tree/classic).

## Synopsis

```typescript
import { deepStrictEqual } from "assert";
import { encode, decode } from "@msgpack/msgpack";

const object = {
  nil: null,
  integer: 1,
  float: Math.PI,
  string: "Hello, world!",
  binary: Uint8Array.from([1, 2, 3]),
  array: [10, 20, 30],
  map: { foo: "bar" },
  timestampExt: new Date(),
};

const encoded: Uint8Array = encode(object);

deepStrictEqual(decode(encoded), object);
```

## Table of Contents

- [Synopsis](#synopsis)
- [Table of Contents](#table-of-contents)
- [Install](#install)
- [API](#api)
  - [`encode(data: unknown, options?: EncoderOptions): Uint8Array`](#encodedata-unknown-options-encoderoptions-uint8array)
    - [`EncoderOptions`](#encoderoptions)
  - [`decode(buffer: ArrayLike<number> | BufferSource, options?: DecoderOptions): unknown`](#decodebuffer-arraylikenumber--buffersource-options-decoderoptions-unknown)
    - [`DecoderOptions`](#decoderoptions)
  - [`decodeMulti(buffer: ArrayLike<number> | BufferSource, options?: DecoderOptions): Generator<unknown, void, unknown>`](#decodemultibuffer-arraylikenumber--buffersource-options-decoderoptions-generatorunknown-void-unknown)
  - [`decodeAsync(stream: ReadableStreamLike<ArrayLike<number> | BufferSource>, options?: DecoderOptions): Promise<unknown>`](#decodeasyncstream-readablestreamlikearraylikenumber--buffersource-options-decoderoptions-promiseunknown)
  - [`decodeArrayStream(stream: ReadableStreamLike<ArrayLike<number> | BufferSource>, options?: DecoderOptions): AsyncIterable<unknown>`](#decodearraystreamstream-readablestreamlikearraylikenumber--buffersource-options-decoderoptions-asynciterableunknown)
  - [`decodeMultiStream(stream: ReadableStreamLike<ArrayLike<number> | BufferSource>, options?: DecoderOptions): AsyncIterable<unknown>`](#decodemultistreamstream-readablestreamlikearraylikenumber--buffersource-options-decoderoptions-asynciterableunknown)
  - [Reusing Encoder and Decoder instances](#reusing-encoder-and-decoder-instances)
- [Extension Types](#extension-types)
    - [ExtensionCodec context](#extensioncodec-context)
    - [Handling BigInt with ExtensionCodec](#handling-bigint-with-extensioncodec)
    - [The temporal module as timestamp extensions](#the-temporal-module-as-timestamp-extensions)
- [Decoding a Blob](#decoding-a-blob)
- [MessagePack Specification](#messagepack-specification)
  - [MessagePack Mapping Table](#messagepack-mapping-table)
- [Prerequisites](#prerequisites)
  - [ECMA-262](#ecma-262)
  - [NodeJS](#nodejs)
  - [TypeScript Compiler / Type Definitions](#typescript-compiler--type-definitions)
- [Benchmark](#benchmark)
- [Distribution](#distribution)
  - [NPM / npmjs.com](#npm--npmjscom)
  - [CDN / unpkg.com](#cdn--unpkgcom)
- [Deno Support](#deno-support)
- [Maintenance](#maintenance)
  - [Testing](#testing)
  - [Continuous Integration](#continuous-integration)
  - [Release Engineering](#release-engineering)
  - [Updating Dependencies](#updating-dependencies)
- [License](#license)

## Install

This library is published to `npmjs.com` as [@msgpack/msgpack](https://www.npmjs.com/package/@msgpack/msgpack).

```shell
npm install @msgpack/msgpack
```

## API

### `encode(data: unknown, options?: EncoderOptions): Uint8Array`

It encodes `data` into a single MessagePack-encoded object, and returns a byte array as `Uint8Array`. It throws errors if `data` is, or includes, a non-serializable object such as a `function` or a `symbol`.

for example:

```typescript
import { encode } from "@msgpack/msgpack";

const encoded: Uint8Array = encode({ foo: "bar" });
console.log(encoded);
```

If you'd like to convert an `uint8array` to a NodeJS `Buffer`, use `Buffer.from(arrayBuffer, offset, length)` in order not to copy the underlying `ArrayBuffer`, while `Buffer.from(uint8array)` copies it:

```typescript
import { encode } from "@msgpack/msgpack";

const encoded: Uint8Array = encode({ foo: "bar" });

// `buffer` refers the same ArrayBuffer as `encoded`.
const buffer: Buffer = Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength);
console.log(buffer);
```

#### `EncoderOptions`

Name|Type|Default
----|----|----
extensionCodec | ExtensionCodec | `ExtensionCodec.defaultCodec`
context | user-defined | -
useBigInt64 | boolean | false
maxDepth | number | `100`
initialBufferSize | number | `2048`
sortKeys | boolean | false
forceFloat32 | boolean | false
forceIntegerToFloat | boolean | false
ignoreUndefined | boolean | false

### `decode(buffer: ArrayLike<number> | BufferSource, options?: DecoderOptions): unknown`

It decodes `buffer` that includes a MessagePack-encoded object, and returns the decoded object typed `unknown`.

`buffer` must be an array of bytes, which is typically `Uint8Array` or `ArrayBuffer`. `BufferSource` is defined as `ArrayBuffer | ArrayBufferView`.

The `buffer` must include a single encoded object. If the `buffer` includes extra bytes after an object or the `buffer` is empty, it throws `RangeError`. To decode `buffer` that includes multiple encoded objects, use `decodeMulti()` or `decodeMultiStream()` (recommended) instead.

for example:

```typescript
import { decode } from "@msgpack/msgpack";

const encoded: Uint8Array;
const object = decode(encoded);
console.log(object);
```

NodeJS `Buffer` is also acceptable because it is a subclass of `Uint8Array`.

#### `DecoderOptions`

Name|Type|Default
----|----|----
extensionCodec | ExtensionCodec | `ExtensionCodec.defaultCodec`
context | user-defined | -
useBigInt64 | boolean | false
maxStrLength | number | `4_294_967_295` (UINT32_MAX)
maxBinLength | number | `4_294_967_295` (UINT32_MAX)
maxArrayLength | number | `4_294_967_295` (UINT32_MAX)
maxMapLength | number | `4_294_967_295` (UINT32_MAX)
maxExtLength | number | `4_294_967_295` (UINT32_MAX)

You can use `max${Type}Length` to limit the length of each type decoded.

### `decodeMulti(buffer: ArrayLike<number> | BufferSource, options?: DecoderOptions): Generator<unknown, void, unknown>`

It decodes `buffer` that includes multiple MessagePack-encoded objects, and returns decoded objects as a generator. See also `decodeMultiStream()`, which is an asynchronous variant of this function.

This function is not recommended to decode a MessagePack binary via I/O stream including sockets because it's synchronous. Instead, `decodeMultiStream()` decodes a binary stream asynchronously, typically spending less CPU and memory.

for example:

```typescript
import { decode } from "@msgpack/msgpack";

const encoded: Uint8Array;

for (const object of decodeMulti(encoded)) {
  console.log(object);
}
```

### `decodeAsync(stream: ReadableStreamLike<ArrayLike<number> | BufferSource>, options?: DecoderOptions): Promise<unknown>`

It decodes `stream`, where `ReadableStreamLike<T>` is defined as `ReadableStream<T> | AsyncIterable<T>`, in an async iterable of byte arrays, and returns decoded object as `unknown` type, wrapped in `Promise`.

This function works asynchronously, and might CPU resources more efficiently compared with synchronous `decode()`, because it doesn't wait for the completion of downloading.

This function is designed to work with whatwg `fetch()` like this:

```typescript
import { decodeAsync } from "@msgpack/msgpack";

const MSGPACK_TYPE = "application/x-msgpack";

const response = await fetch(url);
const contentType = response.headers.get("Content-Type");
if (contentType && contentType.startsWith(MSGPACK_TYPE) && response.body != null) {
  const object = await decodeAsync(response.body);
  // do something with object
} else { /* handle errors */ }
```

### `decodeArrayStream(stream: ReadableStreamLike<ArrayLike<number> | BufferSource>, options?: DecoderOptions): AsyncIterable<unknown>`

It is alike to `decodeAsync()`, but only accepts a `stream` that includes an array of items, and emits a decoded item one by one.

for example:

```typescript
import { decodeArrayStream } from "@msgpack/msgpack";

const stream: AsyncIterator<Uint8Array>;

// in an async function:
for await (const item of decodeArrayStream(stream)) {
  console.log(item);
}
```

### `decodeMultiStream(stream: ReadableStreamLike<ArrayLike<number> | BufferSource>, options?: DecoderOptions): AsyncIterable<unknown>`

It is alike to `decodeAsync()` and `decodeArrayStream()`, but the input `stream` must consist of multiple MessagePack-encoded items. This is an asynchronous variant for `decodeMulti()`.

In other words, it could decode an unlimited stream and emits a decoded item one by one.

for example:

```typescript
import { decodeMultiStream } from "@msgpack/msgpack";

const stream: AsyncIterator<Uint8Array>;

// in an async function:
for await (const item of decodeMultiStream(stream)) {
  console.log(item);
}
```

This function is available since v2.4.0; previously it was called as `decodeStream()`.

### Reusing Encoder and Decoder instances

`Encoder` and `Decoder` classes are provided to have better performance by reusing instances:

```typescript
import { deepStrictEqual } from "assert";
import { Encoder, Decoder } from "@msgpack/msgpack";

const encoder = new Encoder();
const decoder = new Decoder();

const encoded: Uint8Array = encoder.encode(object);
deepStrictEqual(decoder.decode(encoded), object);
```

According to our benchmark, reusing `Encoder` instance is about 20% faster
than `encode()` function, and reusing `Decoder` instance is about 2% faster
than `decode()` function. Note that the result should vary in environments
and data structure.

`Encoder` and `Decoder` take the same options as `encode()` and `decode()` respectively.

## Extension Types

To handle [MessagePack Extension Types](https://github.com/msgpack/msgpack/blob/master/spec.md#extension-types), this library provides `ExtensionCodec` class.

This is an example to setup custom extension types that handles `Map` and `Set` classes in TypeScript:

```typescript
import { encode, decode, ExtensionCodec } from "@msgpack/msgpack";

const extensionCodec = new ExtensionCodec();

// Set<T>
const SET_EXT_TYPE = 0 // Any in 0-127
extensionCodec.register({
  type: SET_EXT_TYPE,
  encode: (object: unknown): Uint8Array | null => {
    if (object instanceof Set) {
      return encode([...object]);
    } else {
      return null;
    }
  },
  decode: (data: Uint8Array) => {
    const array = decode(data) as Array<unknown>;
    return new Set(array);
  },
});

// Map<T>
const MAP_EXT_TYPE = 1; // Any in 0-127
extensionCodec.register({
  type: MAP_EXT_TYPE,
  encode: (object: unknown): Uint8Array => {
    if (object instanceof Map) {
      return encode([...object]);
    } else {
      return null;
    }
  },
  decode: (data: Uint8Array) => {
    const array = decode(data) as Array<[unknown, unknown]>;
    return new Map(array);
  },
});

const encoded = encode([new Set<any>(), new Map<any, any>()], { extensionCodec });
const decoded = decode(encoded, { extensionCodec });
```

Not that extension types for custom objects must be `[0, 127]`, while `[-1, -128]` is reserved for MessagePack itself.

#### ExtensionCodec context

When you use an extension codec, it might be necessary to have encoding/decoding state to keep track of which objects got encoded/re-created. To do this, pass a `context` to the `EncoderOptions` and `DecoderOptions`:

```typescript
import { encode, decode, ExtensionCodec } from "@msgpack/msgpack";

class MyContext {
  track(object: any) { /*...*/ }
}

class MyType { /* ... */ }

const extensionCodec = new ExtensionCodec<MyContext>();

// MyType
const MYTYPE_EXT_TYPE = 0 // Any in 0-127
extensionCodec.register({
  type: MYTYPE_EXT_TYPE,
  encode: (object, context) => {
    if (object instanceof MyType) {
      context.track(object); // <-- like this
      return encode(object.toJSON(), { extensionCodec, context });
    } else {
      return null;
    }
  },
  decode: (data, extType, context) => {
    const decoded = decode(data, { extensionCodec, context });
    const my = new MyType(decoded);
    context.track(my); // <-- and like this
    return my;
  },
});

// and later
import { encode, decode } from "@msgpack/msgpack";

const context = new MyContext();

const encoded = = encode({myType: new MyType<any>()}, { extensionCodec, context });
const decoded = decode(encoded, { extensionCodec, context });
```

#### Handling BigInt with ExtensionCodec

This library does not handle BigInt by default, but you have two options to handle it:

* Set `useBigInt64: true` to map bigint to MessagePack's int64/uint64
* Define a custom `ExtensionCodec` to map bigint to a MessagePack's extension type

`useBigInt64: true` is the simplest way to handle bigint, but it has limitations:

* A bigint is encoded in 8 byte binaries even if it's a small integer
* A bigint must be smaller than the max value of the uint64 and larger than the min value of the int64. Otherwise the behavior is undefined.

So you might want to define a custom codec to handle bigint like this:

```typescript
import { deepStrictEqual } from "assert";
import { encode, decode, ExtensionCodec } from "@msgpack/msgpack";

// to define a custom codec:
const BIGINT_EXT_TYPE = 0; // Any in 0-127
const extensionCodec = new ExtensionCodec();
extensionCodec.register({
  type: BIGINT_EXT_TYPE,
  encode(input: unknown): Uint8Array | null {
    if (typeof input === "bigint") {
      if (input <= Number.MAX_SAFE_INTEGER && input >= Number.MIN_SAFE_INTEGER) {
        return encode(Number(input));
      } else {
        return encode(String(input));
      }
    } else {
      return null;
    }
  },
  decode(data: Uint8Array): bigint {
    const val = decode(data);
    if (!(typeof val === "string" || typeof val === "number")) {
      throw new DecodeError(`unexpected BigInt source: ${val} (${typeof val})`);
    }
    return BigInt(val);
  },
});

// to use it:
const value = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1);
const encoded: = encode(value, { extensionCodec });
deepStrictEqual(decode(encoded, { extensionCodec }), value);
```

#### The temporal module as timestamp extensions

There is a proposal for a new date/time representations in JavaScript:

* https://github.com/tc39/proposal-temporal

This library maps `Date` to the MessagePack timestamp extension by default, but you can re-map the temporal module (or [Temporal Polyfill](https://github.com/tc39/proposal-temporal/tree/main/polyfill)) to the timestamp extension like this:

```typescript
import { Instant } from "@std-proposal/temporal";
import { deepStrictEqual } from "assert";
import {
  encode,
  decode,
  ExtensionCodec,
  EXT_TIMESTAMP,
  encodeTimeSpecToTimestamp,
  decodeTimestampToTimeSpec,
} from "@msgpack/msgpack";

// to define a custom codec
const extensionCodec = new ExtensionCodec();
extensionCodec.register({
  type: EXT_TIMESTAMP, // override the default behavior!
  encode(input: unknown): Uint8Array | null {
    if (input instanceof Instant) {
      const sec = input.seconds;
      const nsec = Number(input.nanoseconds - BigInt(sec) * BigInt(1e9));
      return encodeTimeSpecToTimestamp({ sec, nsec });
    } else {
      return null;
    }
  },
  decode(data: Uint8Array): Instant {
    const timeSpec = decodeTimestampToTimeSpec(data);
    const sec = BigInt(timeSpec.sec);
    const nsec = BigInt(timeSpec.nsec);
    return Instant.fromEpochNanoseconds(sec * BigInt(1e9) + nsec);
  },
});

// to use it
const instant = Instant.fromEpochMilliseconds(Date.now());
const encoded = encode(instant, { extensionCodec });
const decoded = decode(encoded, { extensionCodec });
deepStrictEqual(decoded, instant);
```

This will become default in this library with major-version increment, if the temporal module is standardized.

## Decoding a Blob

[`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) is a binary data container provided by browsers. To read its contents, you can use `Blob#arrayBuffer()` or `Blob#stream()`. `Blob#stream()`
is recommended if your target platform support it. This is because streaming
decode should be faster for large objects. In both ways, you need to use
asynchronous API.

```typescript
async function decodeFromBlob(blob: Blob): unknown {
  if (blob.stream) {
    // Blob#stream(): ReadableStream<Uint8Array> (recommended)
    return await decodeAsync(blob.stream());
  } else {
    // Blob#arrayBuffer(): Promise<ArrayBuffer> (if stream() is not available)
    return decode(await blob.arrayBuffer());
  }
}
```

## MessagePack Specification

This library is compatible with the "August 2017" revision of MessagePack specification at the point where timestamp ext was added:

* [x] str/bin separation, added at August 2013
* [x] extension types, added at August 2013
* [x] timestamp ext type, added at August 2017

The living specification is here:

https://github.com/msgpack/msgpack

Note that as of June 2019 there're no official "version" on the MessagePack specification. See https://github.com/msgpack/msgpack/issues/195 for the discussions.

### MessagePack Mapping Table

The following table shows how JavaScript values are mapped to [MessagePack formats](https://github.com/msgpack/msgpack/blob/master/spec.md) and vice versa.

The mapping of integers varies on the setting of `useBigInt64`.

The default, `useBigInt64: false` is:

Source Value|MessagePack Format|Value Decoded
----|----|----
null, undefined|nil|null (*1)
boolean (true, false)|bool family|boolean (true, false)
number (53-bit int)|int family|number
number (64-bit float)|float family|number
string|str family|string
ArrayBufferView |bin family|Uint8Array (*2)
Array|array family|Array
Object|map family|Object (*3)
Date|timestamp ext family|Date (*4)
bigint|N/A|N/A (*5)

* *1 Both `null` and `undefined` are mapped to `nil` (`0xC0`) type, and are decoded into `null`
* *2 Any `ArrayBufferView`s including NodeJS's `Buffer` are mapped to `bin` family, and are decoded into `Uint8Array`
* *3 In handling `Object`, it is regarded as `Record<string, unknown>` in terms of TypeScript
* *4 MessagePack timestamps may have nanoseconds, which will lost when it is decoded into JavaScript `Date`. This behavior can be overridden by registering `-1` for the extension codec.
* *5 bigint is not supported in `useBigInt64: false` mode, but you can define an extension codec for it.

If you set `useBigInt64: true`, the following mapping is used:

Source Value|MessagePack Format|Value Decoded
----|----|----
null, undefined|nil|null
boolean (true, false)|bool family|boolean (true, false)
**number (32-bit int)**|int family|number
**number (except for the above)**|float family|number
**bigint**|int64 / uint64|bigint (*6)
string|str family|string
ArrayBufferView |bin family|Uint8Array
Array|array family|Array
Object|map family|Object
Date|timestamp ext family|Date


* *6 If the bigint is larger than the max value of uint64 or smaller than the min value of int64, then the behavior is undefined.

## Prerequisites

This is a universal JavaScript library that supports major browsers and NodeJS.

### ECMA-262

* ES2015 language features
* ES2018 standard library, including:
  * Typed arrays (ES2015)
  * Async iterations (ES2018)
  * Features added in ES2015-ES2022
* whatwg encodings (`TextEncoder` and `TextDecoder`)

ES2022 standard library used in this library can be polyfilled with [core-js](https://github.com/zloirock/core-js).

IE11 is no longer supported. If you'd like to use this library in IE11, use v2.x versions.

### NodeJS

NodeJS v14 is required.

### TypeScript Compiler / Type Definitions

This module requires type definitions of `AsyncIterator`, `SourceBuffer`, whatwg streams, and so on. They are provided by `"lib": ["ES2021", "DOM"]` in `tsconfig.json`.

Regarding the TypeScript compiler version, only the latest TypeScript is tested in development.

## Benchmark

Run-time performance is not the only reason to use MessagePack, but it's important to choose MessagePack libraries, so a benchmark suite is provided to monitor the performance of this library.

V8's built-in JSON has been improved for years, esp. `JSON.parse()` is [significantly improved in V8/7.6](https://v8.dev/blog/v8-release-76), it is the fastest deserializer as of 2019, as the benchmark result bellow suggests.

However, MessagePack can handles binary data effectively, actual performance depends on situations. You'd better take benchmark on your own use-case if performance matters.

Benchmark on NodeJS/v18.1.0 (V8/10.1)

operation                                                         |   op   |   ms  |  op/s
----------------------------------------------------------------- | ------: | ----: | ------:
buf = Buffer.from(JSON.stringify(obj));                           |  902100 |  5000 |  180420
obj = JSON.parse(buf.toString("utf-8"));                          |  898700 |  5000 |  179740
buf = require("msgpack-lite").encode(obj);                        |  411000 |  5000 |   82200
obj = require("msgpack-lite").decode(buf);                        |  246200 |  5001 |   49230
buf = require("@msgpack/msgpack").encode(obj);                    |  843300 |  5000 |  168660
obj = require("@msgpack/msgpack").decode(buf);                    |  489300 |  5000 |   97860
buf = /* @msgpack/msgpack */ encoder.encode(obj);                 | 1154200 |  5000 |  230840
obj = /* @msgpack/msgpack */ decoder.decode(buf);                 |  448900 |  5000 |   89780

Note that `JSON` cases use `Buffer` to emulate I/O where a JavaScript string must be converted into a byte array encoded in UTF-8, whereas MessagePack modules deal with byte arrays.

## Distribution

### NPM / npmjs.com

The NPM package distributed in npmjs.com includes both ES2015+ and ES5 files:

* `dist/` is compiled into ES2019 with CommomJS, provided for NodeJS v10
* `dist.es5+umd/` is compiled into ES5 with UMD
  * `dist.es5+umd/msgpack.min.js` - the minified file
  * `dist.es5+umd/msgpack.js` - the non-minified file
* `dist.es5+esm/` is compiled into ES5 with ES modules, provided for webpack-like bundlers and NodeJS's ESM-mode

If you use NodeJS and/or webpack, their module resolvers use the suitable one automatically.

### CDN / unpkg.com

This library is available via CDN:

```html
<script crossorigin src="https://unpkg.com/@msgpack/msgpack"></script>
```

It loads `MessagePack` module to the global object.


## Deno Support

You can use this module on Deno.

See `example/deno-*.ts` for examples.

`deno.land/x` is not supported yet.

## Maintenance

### Testing

For simple testing:

```
npm run test
```

### Continuous Integration

This library uses Travis CI.

test matrix:

* TypeScript targets
  * `target=es2019` / `target=es5`
* JavaScript engines
  * NodeJS, browsers (Chrome, Firefox, Safari, IE11, and so on)

See [test:* in package.json](./package.json) and [.travis.yml](./.travis.yml) for details.

### Release Engineering

```console
# run tests on NodeJS, Chrome, and Firefox
make test-all

# edit the changelog
code CHANGELOG.md

# bump version
npm version patch|minor|major

# run the publishing task
make publish
```

### Updating Dependencies

```console
npm run update-dependencies
```

## License

Copyright 2019 The MessagePack community.

This software uses the ISC license:

https://opensource.org/licenses/ISC

See [LICENSE](./LICENSE) for details.
