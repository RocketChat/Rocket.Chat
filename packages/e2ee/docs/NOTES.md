# Notes

## Bookmarks
- [[NEW] Encrypted Discussions and new Encryption Permissions](https://github.com/RocketChat/Rocket.Chat/pull/20201)
- [feat!: Allow E2EE rooms to reset its room key](https://github.com/RocketChat/Rocket.Chat/pull/33328)
- [refactor!: Room's Key ID generation](https://github.com/RocketChat/Rocket.Chat/pull/33329)

## Tasks

### Shared Package
- Separate all client-side e2ee logic from core into zero-dependency runtime-agnostic [package](../src/index.ts).
	- Things like nodejs Buffer and SubtleCrypto are not available from React Native.
- Create adapter for [web](../../e2ee-web/)
- Create adapter for [node](../../e2ee-node/) (testing purposes)
- Create adapter for react-native

### Refactor Web
- Remove use of enums for state in favor of literal types.

### Dependency Cleanup
- Remove use of `ejson` for serializing/deserializing Uint8Array: [codec.ts](../src/codec.ts#L165-L175)
	- It is simply a JSON with a "$binary" field containing the base64 encoded data.
- Remove use of `bytebuffer` for encoding/decoding strings: [binary.ts](../src/binary.ts)
	- ByteBuffer.wrap('hello', 'binary').toArrayBuffer()
	- ByteBuffer.wrap('hello').toString('binary')

### Improve Tests
- Tests in [e2e-encryption.ts](../../../apps/meteor/tests/e2e/e2e-encryption.spec.ts) are failing when ran:
	- More than once: lack of cleanup
	- Out of order: inter-test dependencies
	- Locally: slowness of CI + retries are masking bugs (eg: in full page loads)