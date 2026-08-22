---
'@rocket.chat/apps': patch
---

Replaces the `jsonrpc-lite` dependency with a minimal, purpose-built set of JSON-RPC 2.0 types and helpers for the apps runtime bridge. `jsonrpc-lite` validated every message it built by running `JSON.stringify` over it and discarding the result, which was pure overhead here since the bridge serializes with msgpack rather than JSON.

Message reconstruction now lives in a dedicated msgpack codec extension that tags each JSON-RPC envelope class on encode and rebuilds the exact instance on decode. This makes the codec the single place that maps between the wire form and the message classes on both sides of the bridge, so callers dispatch directly off the decoded instances instead of a separate parse/categorization step.
