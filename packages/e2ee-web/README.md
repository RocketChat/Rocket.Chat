# @rocket.chat/e2e-crypto-core

Runtime-agnostic, **sans-IO** end-to-end encryption core for Rocket.Chat providing:

- Pluggable provider interfaces (crypto, randomness, hashing, storage, network)
- Double Ratchet skeleton for forward secrecy
- Group key derivation & rotation helpers
- Message serialization & integrity (MAC) helpers
- Replay protection utilities
- Strict TypeScript types; no direct I/O, DOM, Node, or platform API usage

> NOTE: This package deliberately avoids binding to WebCrypto / Node crypto; you must supply providers.

## Design Principles

1. **Sans-IO**: All side-effects (key persistence, network, randomness, system crypto) are injected.
2. **Agnostic**: Works in browsers, Node.js, React Native, workers—given compatible providers.
3. **Composability**: Small focused modules (ratchet, key mgmt, integrity, replay, codec).
4. **Explicit Types**: Strong typing for every boundary; opaque `Uint8Array` for binary.
5. **Security First**: Forward secrecy (Double Ratchet), AEAD (AES-256-GCM or ChaCha20-Poly1305 via provider), MAC utilities, replay cache hooks.

## Core Modules

| Module | Purpose |
| ------ | ------- |
| `providers/interfaces.ts` | Abstract provider contracts |
| `core/doubleRatchet.ts` | Ratchet state machine (simplified) |
| `core/keyManagement.ts` | Identity & group key helpers |
| `core/messageCodec.ts` | Canonical (JSON/Base64) serialization |
| `core/messageIntegrity.ts` | MAC computation / verification |
| `core/replayProtection.ts` | Replay cache + ID helpers |
| `protocol/session.ts` | High-level session manager wrapper |

## Provider Interfaces

Implement and inject:

```ts
import { ProviderContext } from '@rocket.chat/e2e-crypto-core';

const ctx: ProviderContext = {
  crypto: /* your CryptoProvider */,
  rng: /* RandomnessProvider */,
  hash: /* HashProvider */,
  storage: /* KeyStorageProvider */,
  net: /* optional NetworkProvider */,
};
```

## Basic Usage (1:1 Session)

```ts
import { SessionManager, KeyManager, serializePayload, deserializePayload } from '@rocket.chat/e2e-crypto-core';

// ctx: ProviderContext injected
const keyMgr = new KeyManager(ctx);
await keyMgr.ensureIdentityKey();

// Assume we fetched peer pre-key bundle externally
const sessionMgr = new SessionManager(ctx);
const init = {
  theirIdentityKey: peerBundle.identityKey,
  theirSignedPreKey: peerBundle.signedPreKey,
  theirOneTimePreKey: peerBundle.oneTimePreKeys?.[0],
  isInitiator: true,
};

// Encrypt
const plaintext = new TextEncoder().encode('hello');
const payload = await sessionMgr.encrypt('peer-user-id', plaintext);
const wire = serializePayload(payload); // send over DDP / WebSocket / REST

// Decrypt (other side)
const received = deserializePayload(wire);
const result = await sessionMgr.decrypt('peer-user-id', received);
console.log(new TextDecoder().decode(result.plaintext));
```

## Group Messaging (Conceptual)

Use `GroupKeyManager` to rotate epoch keys; wrap `EncryptedPayload` in `serializeGroupEnvelope`.

## Error Handling

All protocol-specific errors throw `ProtocolError` with a `code` field for switch handling.

## Extending / Hardening

Production needs (out of scope of this skeleton):
- Skipped message key handling & storage
- Full DH ratchet step logic & header validation
- Signature verification of pre-key bundles
- Authentic secondary MAC with independent key material
- More robust replay filtering (e.g. bloom filter)
- Formal test vectors & interoperability tests

## License
MIT
