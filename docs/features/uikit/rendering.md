# Rendering pipeline

How `SurfaceRenderer.render(blocks)` in [`packages/ui-kit/src/rendering/SurfaceRenderer.ts`](../../../packages/ui-kit/src/rendering/SurfaceRenderer.ts) turns an app's block list into output (React elements in Fuselage, Preact in Livechat).

## Steps

1. **Conditional blocks are unwrapped.** Each `conditional` block is replaced by its `render` list when its `when` filter matches the renderer's `Conditions`, and dropped otherwise. The only condition is `engine` (`'rocket.chat'` or `'livechat'`). With no `Conditions` passed, every conditional block matches. Conditional blocks do not nest: a `conditional` inside `render` is not unwrapped, and the allowlist step then drops it.
2. **Blocks outside the surface allowlist are dropped.** The allowlist is the array the renderer class passes to `super()`. Nothing is reported; the block simply does not appear.
3. **Each remaining block goes to the renderer method named after its `type`** (`section`, `actions`, ...), called with `BlockContext.BLOCK`. A missing method means the block renders as nothing.
4. **Block components render their children** through the renderer again, using the context helpers below. Text objects go to `plain_text` and `mrkdwn`, which every renderer must implement.

## Block contexts

The same method can be reached from different places, so every call carries a `BlockContext` and methods use it to decide what to return. `image` is the clearest case: in `BLOCK` context it draws an image block; anywhere else it draws an image element.

| Context | Reached through | Used for |
| --- | --- | --- |
| `BLOCK` | `render()` | Top-level layout blocks. |
| `SECTION` | `renderSectionAccessoryBlockElement` | `section.accessory`. |
| `ACTION` | `renderActionsBlockElement` | Elements of `actions`. |
| `FORM` | `renderInputBlockElement` | `input.element`. |
| `CONTEXT` | `renderContextBlockElement` | Elements of `context`, text objects included. |
| `NONE` | `renderTextObject` default | Text with no particular container. |

Fuselage's `renderTextObject` returns `null` in `BLOCK` context, so a bare text object in a block list renders as nothing.

## Element filtering is not enforced when the container is allowed

Each context helper has a guard (`isActionsBlockElement`, `isInputBlockElement`, `isContextBlockElement`, `isSectionBlockAccessoryElement`). A guard only runs when the container block is **not** in the surface allowlist. When the container is allowed, any element type reaches its renderer method, whatever the block's type says.

The guard lists are also shorter than the types. For example, `isInputBlockElement` leaves out `checkbox`, `radio_button`, `toggle_switch`, `time_picker` and the multi users/channels selects, all of which `InputBlock` accepts. The types in [reference.md](reference.md) are the contract; the guards are not.

## Which allowlist applies

There are two families of renderer, and they get their allowlists from different places:

- **Livechat** (`MessageParser`) extends `UiKitParserMessage`, so it uses the allowlist declared in `packages/ui-kit`.
- **Fuselage** renderers extend `FuselageSurfaceRenderer`, which extends `SurfaceRenderer` directly. They never use the `UiKitParser*` allowlists. Each one passes its own list, and `BannerSurfaceRenderer` falls back to the default in `FuselageSurfaceRenderer`.

As a result the web client and the types disagree about several surfaces. [support-matrix.md](support-matrix.md) lists each disagreement.

## Links

`button`, `icon_button` and overflow options open their `url` unless `isSafeUrl` from `@rocket.chat/ui-kit` rejects it. It rejects URLs whose scheme runs code in the page (`javascript:`, `data:`, `vbscript:`, in any letter case or with leading whitespace) and URLs that cannot be parsed. Everything else opens as before, including app deep links such as `zoommtg:` or `msteams:` and relative URLs. A rejected URL is ignored, and the element behaves as if it had none: it sends its `blockAction` instead of opening a link. Both Fuselage and Livechat apply the same check.

## Other renderers

`apps/meteor/client/views/admin/subscription/surface/UiKitSubscriptionLicenseSurface.tsx` defines `SubscriptionLicenseSurfaceRenderer`, an internal surface built on `FuselageSurfaceRenderer` that apps do not use. The support matrix leaves it out.
