# Adding a block or element

A UiKit block or element only works once every layer knows about it. Missing one layer usually fails silently: the block is dropped or renders as nothing. Work through the list, then update the docs.

## 1. Type (`packages/ui-kit`)

- [ ] Add the type in `src/blocks/layout/` (layout block) or `src/blocks/elements/` (element). Wrap layout blocks in `LayoutBlockish<…>`. Wrap interactive elements in `Actionable<…>`, which adds `appId`, `blockId`, `actionId`, `confirm` and `dispatchActionConfig`.
- [ ] Add it to the union in `src/blocks/LayoutBlock.ts` or `src/blocks/BlockElement.ts`.
- [ ] Add the constant in `src/blocks/LayoutBlockType.ts` or `src/blocks/BlockElementType.ts`. A `satisfies` check fails the typecheck if the constant and the union disagree.
- [ ] Interactive element: add it to `src/blocks/ActionableElement.ts`, and map its value type in `src/rendering/ActionOf.ts`.
- [ ] Export it from `src/index.ts`.

## 2. Where it may appear (`packages/ui-kit`)

- [ ] Layout block: add it to each surface layout union **and** to the array passed to `super()` in `src/surfaces/<surface>/UiKitParser<Surface>.ts`.
- [ ] Element: add it to each container type that should accept it (`ActionsBlock.elements`, `InputBlock.element`, `SectionBlock.accessory`, ...). Also update the matching guard (`isActionsBlockElement`, `isInputBlockElement`, ...); see [rendering.md](rendering.md#element-filtering-is-not-enforced-when-the-container-is-allowed) for when guards apply.

## 3. Web renderer (`packages/fuselage-ui-kit`)

- [ ] Add the component in `src/blocks/` or `src/elements/`. Interactive elements read and dispatch their value with `useUiKitState` (`src/hooks/useUiKitState.ts`); initial values come from `src/utils/getInitialValue.ts`.
- [ ] Add the renderer method named after the `type`: on `FuselageSurfaceRenderer` if every surface should draw it, otherwise on the specific `*SurfaceRenderer`. Check the `BlockContext` it will be called with.
- [ ] Layout block: add it to the allowlist of each Fuselage surface renderer. These are separate from the `ui-kit` parser allowlists.

## 4. Livechat (`packages/livechat`), message blocks only

- [ ] If Livechat should show it, add a component under `src/components/uiKit/message/` and a method on `MessageParser`. Otherwise, apps can wrap Rocket.Chat-only content in a `conditional` block with `when: { engine: ['rocket.chat'] }`.

## 5. Apps-engine (`packages/apps-engine`)

- [ ] New blocks need nothing: messages and surfaces are typed as `LayoutBlock[]` from `@rocket.chat/ui-kit`. Do not extend the deprecated `BlockBuilder`.
- [ ] A new **interaction** (a new payload type, or a new kind of response) needs apps-engine and host changes; see [interactions.md](interactions.md).

## 6. Playground, tests, docs

- [ ] Add a sample payload in `packages/fuselage-ui-kit/src/stories/payloads/` (export it from `payloads/index.ts`). Add a story in `Message.stories.tsx`, `Modal.stories.tsx` or `Banner.stories.tsx` for each surface that accepts it. The Storybook (`yarn workspace @rocket.chat/fuselage-ui-kit storybook`) is the UiKit playground.
- [ ] Extend `src/surfaces/<surface>/UiKitParser<Surface>.spec.ts` in `ui-kit` and add a component spec in `fuselage-ui-kit`.
- [ ] Add the block's fields to [reference.md](reference.md) and its surfaces and renderers to [support-matrix.md](support-matrix.md). If the type, the `ui-kit` parser and the renderers do not all agree, list the difference under **Divergences**.
- [ ] Add a changeset for every published package you touched (`@rocket.chat/ui-kit`, `@rocket.chat/fuselage-ui-kit`, and `@rocket.chat/apps-engine` if its types changed).