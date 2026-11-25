---
'@rocket.chat/xmpp-server': patch
---

Fixes the XMPP service running out of memory and stopping when a remote server floods it during server-to-server negotiation. Any host that could reach the server-to-server port could trigger this by claiming a domain it controls, with no account and no allowed domain. An outbound connection is now closed with `policy-violation` once the remote server has sent more than 32 negotiation elements that were not asked for, and a domain verification closed this way fails.
