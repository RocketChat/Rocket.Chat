---
'@rocket.chat/ui-kit': minor
'@rocket.chat/fuselage-ui-kit': minor
'@rocket.chat/apps-engine': minor
'@rocket.chat/apps': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/ui-contexts': minor
'@rocket.chat/meteor': minor
---

Adds `external_select` and `multi_external_select` UiKit elements. The options come from the app: as the user types, Rocket.Chat sends a `blockSuggestion` interaction and the app answers through the new `executeBlockSuggestionHandler` method with the options to show.
