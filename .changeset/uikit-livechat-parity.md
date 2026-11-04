---
'@rocket.chat/livechat': minor
'@rocket.chat/apps-engine': minor
'@rocket.chat/apps': minor
'@rocket.chat/meteor': minor
---

Renders more UiKit blocks in the Livechat widget (`callout`, `header`, `markdown`, `preview`, `table`, `video`, `context_actions` and `multi_static_select`) and lets visitors use app modals: the widget applies `modal.open`, `modal.update`, `modal.close` and `errors` responses, and sends `viewSubmit` and `viewClosed`, which reach apps through the new `executeLivechatViewSubmitHandler` and `executeLivechatViewClosedHandler` methods.
