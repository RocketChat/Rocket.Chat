# UiKit

UiKit is the JSON block language Rocket.Chat Apps use to draw UI inside the client: message blocks, modals, banners and the contextual bar. It is modelled on Slack's Block Kit, but neither the field names nor the block set are compatible (see [slack-parity.md](slack-parity.md)).

## Where it lives

| Layer | Package | Role |
| --- | --- | --- |
| Types and rendering contract | [`packages/ui-kit`](../../../packages/ui-kit) | Block, element and text-object types; one `UiKitParser*` per surface; the `SurfaceRenderer` base class; interaction payload types. |
| App-facing API | [`packages/apps-engine`](../../../packages/apps-engine/src/definition/uikit) | What apps import. Messages and surfaces take `LayoutBlock[]` from `@rocket.chat/ui-kit`; `BlockBuilder` and the `I*Block` interfaces are deprecated. Interaction handlers (`executeBlockActionHandler`, `executeViewSubmitHandler`, ...) live here. |
| Web renderer | [`packages/fuselage-ui-kit`](../../../packages/fuselage-ui-kit) | React components for every block and element, one `*SurfaceRenderer` per surface. Its Storybook is the UiKit playground. |
| Livechat renderer | [`packages/livechat/src/components/uiKit`](../../../packages/livechat/src/components/uiKit) | Preact renderer for message blocks in the Livechat widget. Covers a subset of blocks and elements. |
| Host | `apps/meteor` | Mounts each surface, sends user interactions to the app and applies the app's responses. |

## Pages

| Page | What it answers |
| --- | --- |
| [reference.md](reference.md) | Every block, element, text object, composition object and view, with its fields. **Generated.** |
| [support-matrix.md](support-matrix.md) | Which blocks each surface accepts and which renderer draws them, plus every place the layers disagree. **Generated.** |
| [rendering.md](rendering.md) | How a list of blocks turns into UI: conditional blocks, allowlists, block contexts, element dispatch. |
| [text-objects.md](text-objects.md) | `plain_text` and `mrkdwn`, which markdown dialect applies, and `i18n`. |
| [surfaces.md](surfaces.md) | Message, modal, banner, contextual bar and attachment: what each one is for and what its view carries. |
| [interactions.md](interactions.md) | Round trip from a click or a submit to the app and back. |
| [adding-a-block.md](adding-a-block.md) | Every place a new block or element has to be wired. |
| [slack-parity.md](slack-parity.md) | What Block Kit has that UiKit lacks, and what only UiKit has. |

## Generated pages

`reference.md` and `support-matrix.md` are produced from the TypeScript sources by [`packages/ui-kit/scripts/generate-docs.mts`](../../../packages/ui-kit/scripts/generate-docs.mts). Do not edit them by hand. After changing a block type, a surface union or a renderer, regenerate them:

```sh
yarn workspace @rocket.chat/ui-kit docs
```

CI runs `yarn workspace @rocket.chat/ui-kit docs:check` in the lint job and fails when the committed pages are stale.

## Experimental and unfinished

- `tab_navigation` and `tab` (`ExperimentalTabNavigationBlock`, `ExperimentalTabElement`) are experimental. Only the contextual bar renders them.
- `conversations_select` and `multi_conversations_select` are declared (with a `@todo`) and accepted by `actions` and `input`, but no renderer draws them.
- The `attachment` surface has a parser in `ui-kit` but no client renderer.
