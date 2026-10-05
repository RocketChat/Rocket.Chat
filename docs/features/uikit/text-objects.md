# Text objects

Every label, title and paragraph in UiKit is a text object: `plain_text` or `mrkdwn`. Field definitions are in [reference.md](reference.md#text-objects).

## `plain_text`

- **Fuselage** renders the text as-is and ignores `emoji`.
- **Livechat** converts emoji shortnames to unicode and then renders the text through `MarkdownBlock`, so markdown in a `plain_text` *is* formatted there. `emoji` turns emoticon conversion on (default off). See [`PlainText/index.tsx`](../../../packages/livechat/src/components/uiKit/message/PlainText/index.tsx).

Do not rely on either behaviour: send `mrkdwn` when formatting is wanted.

## `mrkdwn`

Despite the name, this is **not** Slack's mrkdwn. It is Rocket.Chat message markdown:

- **Fuselage** parses the text with `@rocket.chat/message-parser` and renders the tokens with `@rocket.chat/gazzodown`, the same pipeline as chat messages, with emoticons disabled. See [`MarkdownTextElement.tsx`](../../../packages/fuselage-ui-kit/src/elements/MarkdownTextElement.tsx).
- **Livechat** renders it with its own `MarkdownBlock`, converts emoji shortnames to unicode and enables emoticons. See [`Mrkdwn/index.tsx`](../../../packages/livechat/src/components/uiKit/message/Mrkdwn/index.tsx).

So `*bold*` and `_italic_` behave as in a Rocket.Chat message, and anything specific to Slack (`<@U123>` mentions, `<!here>`, `<url|label>` links) is not interpreted. `verbatim` is declared but ignored by both renderers.

## `i18n`

Both text types accept an `i18n` object (`key`, optional `ns`, optional `args`). Fuselage translates `key` through [`useAppTranslation`](../../../packages/fuselage-ui-kit/src/hooks/useAppTranslation.ts). The namespace is `app-<appId>` (the app's own translations); for app IDs ending in `-core`, which are internal surfaces, it is the default Rocket.Chat namespace instead. `ns` overrides either one, `args` are interpolation values, and `text` is the fallback when the key is missing. Livechat ignores `i18n` and always shows `text`.

Always fill `text` as well, since it is what Livechat shows and the fallback when the key is missing.
