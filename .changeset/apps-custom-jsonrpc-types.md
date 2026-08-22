---
'@rocket.chat/apps': patch
---

Replaces the `jsonrpc-lite` dependency with a minimal, purpose-built set of JSON-RPC 2.0 types and helpers for the apps runtime bridge. `jsonrpc-lite` validated every message it built by running `JSON.stringify` over it and discarding the result, which was pure overhead here since the bridge serializes with msgpack rather than JSON. The new helpers construct the same message shapes without that validation.
