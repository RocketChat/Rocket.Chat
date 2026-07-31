---
'@rocket.chat/livechat': minor
---

Updated the MessageSeparator component in the Livechat widget to show user-friendly labels instead of always displaying the full formatted date.
Changes:

Added a getDateLabel helper function that compares the message date against today and yesterday
Messages from today now show "Today"
Messages from yesterday now show "Yesterday"
Older messages still display the full formatted date (e.g. MAY 15, 2026)

Files changed: packages/livechat/src/components/Messages/MessageSeparator/index.tsxe
