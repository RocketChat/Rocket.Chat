---
'@rocket.chat/xmpp-server': patch
---

Fixes the XMPP service running out of memory and stopping when a remote server floods it during server-to-server negotiation. Any host that could reach the server-to-server port could trigger this without an account, by claiming a domain it controls that the Domain Allow List accepts. With the list empty, which is the default, every domain is accepted. An outbound connection now holds at most 4 negotiation elements that were not asked for while it negotiates, and none once authenticated. One more closes it with `policy-violation`, and a domain verification closed this way fails. At most 64 domain verifications now run at once; a request past that fails without connecting to the claimed domain.
