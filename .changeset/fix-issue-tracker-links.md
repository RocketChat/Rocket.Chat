---
'@rocket.chat/gazzodown': patch
'meteor': patch
---

fix: restore Issue Tracker Links feature

Resolves #26538 by re-adding the IssueLinks_LinkTemplate setting and properly rendering numeric channel mentions as external issue links when the setting is configured.
