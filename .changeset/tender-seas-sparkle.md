---
'@rocket.chat/meteor': minor
---

Introduces Cold Storage Archiving for Read Receipts to improve performance and scalability in large deployments.

Enterprise workspaces can now archive older read receipts into a dedicated cold storage collection, reducing the size of the primary read receipts dataset and improving query performance in environments with high message volumes.

This feature is disabled by default and can be enabled through the new setting:

**Message → Read Receipts → Enable Read Receipts Cold Storage**

This feature is especially recommended for deployments with high message throughput and long data retention requirements, where reducing the size of hot collections significantly improves overall system responsiveness.
