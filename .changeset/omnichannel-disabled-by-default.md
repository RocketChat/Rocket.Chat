---
'@rocket.chat/meteor': major
---

Changes the default value of the `Omnichannel enabled` setting (`Livechat_enabled`) to `false`. New workspaces must now enable Omnichannel explicitly in Administration > Settings > Omnichannel. Existing workspaces keep their current value on upgrade, whether Omnichannel was enabled or disabled.
