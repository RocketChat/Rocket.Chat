---
'@rocket.chat/federation-matrix': patch
'@rocket.chat/meteor': patch
---

Fixes federation endpoints rejecting requests that are valid per the Matrix specification:

- `publicRooms` (GET and POST) required params/fields the spec marks optional
- `query/profile` rejected spec-valid profile fields such as `m.tz`
- `get_missing_events` required the optional `limit` field and bounded it
- `make_join` returned 500 instead of 400 `M_INCOMPATIBLE_ROOM_VERSION` for unsupported room versions
- `backfill` rejected spec-valid `limit` values
- `send` rejected an entire transaction when a single PDU didn't match a fixed event shape, instead of reporting failures per PDU

Also links every federation endpoint to its definition in the Matrix specification.
