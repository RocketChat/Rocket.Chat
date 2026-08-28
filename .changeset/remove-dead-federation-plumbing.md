---
'@rocket.chat/core-services': major
'@rocket.chat/rest-typings': major
'@rocket.chat/core-typings': major
'@rocket.chat/meteor': major
'@rocket.chat/i18n': major
---

Removes dead code left behind by the old Matrix bridge federation: the `Federation`/`FederationEE` service proxies and `IFederationService`/`IFederationServiceEE` interfaces (no service implemented them anymore), the never-implemented `/v1/federation/*` REST endpoint typings (`searchPublicRooms`, `joinExternalPublicRoom`, `listServersByUser`, `addServerByUser`, `removeServerByUser`), the listener-less `federation.userRoleChanged` event, unused federation v1 statistics fields and types, the old two-server federation E2E test suite, and orphaned translation keys.
