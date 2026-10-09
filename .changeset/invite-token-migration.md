---
'@rocket.chat/meteor': major
'@rocket.chat/core-typings': major
'@rocket.chat/model-typings': major
'@rocket.chat/models': major
---

Separates invite tokens from record IDs and omits tokens and URLs from invite listings. New invitations use cryptographically random UUID tokens. An upgrade migration preserves old URLs with new internal record IDs and keeps existing expiry and usage limits. Legacy links without an expiry become invalid 90 days after migration starts; rerunning the migration does not extend that period. Invite creators receive strong-token replacement links rather than reusing legacy links. Integrations must use `inviteToken` or the returned `url` when sharing invitations, and use the current record ID for removal.
