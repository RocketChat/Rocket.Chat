---
'@rocket.chat/xmpp-server': patch
---

Fixes the XMPP service running out of memory and stopping when a remote server floods it during server-to-server negotiation. Any host that could reach the server-to-server port could trigger this without an account, by claiming a domain it controls that `XMPP_Server_Domain_Allow_List` accepts. With the list empty, which is the default, every domain is accepted. An outbound connection now holds at most 32 negotiation elements that were not asked for at the same time. One more closes it with `policy-violation`, and a domain verification closed this way fails.
