# Notes

## History
- [[NEW] Support for end to end encryption](https://github.com/RocketChat/Rocket.Chat/pull/10094)
- [Improve: Decrypt last message](https://github.com/RocketChat/Rocket.Chat/pull/12173)
- [[NEW] Encrypted Discussions and new Encryption Permissions](https://github.com/RocketChat/Rocket.Chat/pull/20201)
- [[FIX] Ensure E2E is enabled/disabled on sending message](https://github.com/RocketChat/Rocket.Chat/pull/21084)
- [[NEW] E2E password generator](github.com/RocketChat/Rocket.Chat/pull/24114)
- [[IMPROVE] Require acceptance when setting new E2E Encryption key for another user](https://github.com/RocketChat/Rocket.Chat/pull/27556)
- [feat: Un-encrypted messages not allowed in E2EE rooms](https://github.com/RocketChat/Rocket.Chat/pull/32040)
- [feat(E2EE): Async E2EE keys exchange](https://github.com/RocketChat/Rocket.Chat/pull/32197)
- [feat(E2EEncryption): File encryption support](https://github.com/RocketChat/Rocket.Chat/pull/32316)
- [regression(E2EEncryption): Service Worker not installing on first load](https://github.com/RocketChat/Rocket.Chat/pull/32674)
- [feat!: Allow E2EE rooms to reset its room key](https://github.com/RocketChat/Rocket.Chat/pull/33328)
- [refactor!: Room's Key ID generation](https://github.com/RocketChat/Rocket.Chat/pull/33329)
- [feat: E2EE rom key reset modal](https://github.com/RocketChat/Rocket.Chat/pull/33503)
- [chore: Update types of `e2e.room` file](https://github.com/RocketChat/Rocket.Chat/pull/34944)

## Tasks

### Shared Package
- Separate all client-side e2ee logic from core into zero-dependency runtime-agnostic [package](../src/index.ts).
	- Things like nodejs Buffer and SubtleCrypto are not available from React Native.
- Create adapter for [web](../../e2ee-web/)
- Create adapter for [node](../../e2ee-node/) (testing purposes)
- Create adapter for react-native

### Refactor Web

#### Maintainance/Interop
- Remove use of non-javascript constructs:
	- `enum` -> `literal types`.
	- `private member` -> `#member`.
	- Use `localStorage` and/or `sessionStorage` explicitly instead of:
		[Accounts.storageLocation](../../../apps/meteor/definition/externals/meteor/accounts-base.d.ts).
		[Meteor._localStorage](../../../apps/meteor/app/ui-master/server/scripts.ts)

#### Dependency Cleanup
- Remove use of `ejson` for serializing/deserializing Uint8Array: [codec.ts](../src/codec.ts#L165-L175)
	- It is simply a JSON with a "$binary" field containing the base64 encoded data.
- Remove use of `bytebuffer` for encoding/decoding strings: [binary.ts](../src/binary.ts)
	- ByteBuffer.wrap('hello', 'binary').toArrayBuffer()
	- ByteBuffer.wrap('hello').toString('binary')

#### Improve Tests
- Tests in [e2e-encryption.ts](../../../apps/meteor/tests/e2e/e2e-encryption.spec.ts) are failing when ran:
	- More than once: lack of cleanup
	- Out of order: inter-test dependencies
	- Locally: slowness of CI + retries are masking bugs (eg: in full page loads)

### Introduce AES-GCM
- Add AES‑GCM primitives alongside AES‑CBC
- Introduce a versioned “envelope” that records the cipher mode
- Default new writes to AES‑GCM; keep multi‑strategy decryption with fallback to AES‑CBC
- Update key derivation to produce AES keys for either mode
- Add tests for both modes and for mixed-mode migration

#### The compatibility strategy (WIP)
1. Versioned envelope
	- V1: `{ version: '1', mode: 'AES-CBC', ivB64, ctB64, kdf: {…} }`
	- V2: `{ version: '2', mode: 'AES-GCM', ivB64, ctB64, tagLen, aadB64?, kdf: { ... } }`
2. Dual-read, single-write
	- On decode, try:
		- If parseable as JSON and has version/mode:
			- If `mode === AES‑GCM`: decrypt with AES‑GCM
			- If `mode === AES‑CBC`: decrypt with AES‑CBC (existing code)
		- Else (legacy “vector + ciphertext” blob):
			- Treat as AES‑CBC with current [split/join helpers](../src/vector.ts).
	- On encode, default to `AES‑GCM` for new data.
		- All readers will still accept older `CBC` payloads.
		- New payloads advertise `GCM`.
3. Derivation and key types
	- WebCrypto requires the CryptoKey algorithm.name to match the operation (CBC vs GCM).
	- Add a generic derivation that yields raw bits, then import for the required algorithm:
	- deriveBits with PBKDF2:
		- `importKey('raw', …, { name: 'AES-GCM'|'AES-CBC', ... }, false, ['encrypt','decrypt'])`
	- Keep existing CBC derivation for old data.
	- For new GCM data, import the same bits as AES‑GCM.