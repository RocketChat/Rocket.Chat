---
'@rocket.chat/fuselage': minor
'@rocket.chat/ui-client': patch
'@rocket.chat/ui-conference': patch
'@rocket.chat/ui-emoji-picker': patch
'@rocket.chat/ui-media': patch
'@rocket.chat/ui-registration': patch
'@rocket.chat/ui-video-conf': patch
'@rocket.chat/ui-voip': patch
'@rocket.chat/meteor': patch
---

Renders `CheckBox`, `RadioButton`, `ToggleSwitch`, `Chip`, `Badge`, `ButtonGroup`, `Button`, `IconButton` and `SplitButton` with Tamagui frames compiled to static CSS. Their look is unchanged at the default font size and in the light and high-contrast themes; the differences are listed below. Each one now declares a platform-neutral contract (`<Component>.contract.ts`) and takes it plus a typed set of web attributes.

The Fuselage stylesheet declares the Tamagui token variables (`--t-space-*`, `--t-size-*`, `--t-radius-*`, `--t-zIndex-*`), so the frames resolve their tokens where Fuselage runs on the Tamagui runtime and not only in a zero-runtime build.

The published build registers the Tamagui configuration itself when it is loaded, so the components render without the consumer configuring Tamagui. Zero-runtime builds compile the sources and do not include the registration.

### Breaking for npm consumers

- `style` is no longer accepted by these components and no longer reaches their elements. Their props narrow to the attributes they declare: an attribute outside that list no longer type-checks, and one passed anyway is not forwarded. This includes the native `input` of `CheckBox`, `RadioButton` and `ToggleSwitch`, which takes the attributes and handlers forms and field labels hand an input (`name`, `value`, `checked`, `defaultChecked`, `disabled`, `readOnly`, `required`, `autoFocus`, `tabIndex`, `inert`, `title`, `onChange`, `onBlur`, `onFocus`, `onClick`, `onKeyDown`), `id`, `aria-*` and `data-*`.
- `Button`, `IconButton` and `Chip`: `onPress` is the press handler. `onClick` still works on the web as a deprecated alias and still receives the event.
- `Button` and `IconButton` take, besides their variations: `id`, `className`, `title`, `role`, `tabIndex`, `aria-*`, `data-*`, `is` (`'button'` or `'a'`), `external`, `type`, `form`, `name`, `value`, `autoFocus`, `href`, `target`, `rel`, `download`, and the pointer, keyboard, focus and touch handlers a menu or tooltip trigger hands a button. `Button` also takes `onDragOver` and `onDrop`. Other DOM attributes, `label` among them, are no longer forwarded.
- `Button` and `IconButton` are no longer Boxes: `Margins` does not give them a margin, and they take no Box styling.
- `IconButton` renders its glyph inside a `span` (`button > span > i`). A link (`is='a'`) has no disabled look and no longer receives a `disabled` attribute.
- A class that overrides a property the component sets needs a higher specificity than one class, such as `&[class]`: the compiled rules come last in the page.
- `Chip` no longer goes through `withBoxStyling`, so Box styling props stop reaching it.
- `Badge`: the `is` prop is removed; it always renders a `span`, and it takes no DOM handlers.
- `ButtonGroup`: besides its variations it takes `id`, `title`, `role`, `aria-label`, `aria-labelledby`, `aria-orientation`, `data-*`, `onClick` and the capture handlers a toolbar uses (`onKeyDownCapture`, `onFocusCapture`, `onBlurCapture`).
- `SplitButton` no longer restyles its children with selectors: the `Button`, `IconButton` and `SplitButtonTrigger` inside it read their place and the tone of the group from it.
- A `testID` prop is accepted by all nine and is written as `data-testid`.
- The theme hooks that reached these components are gone, with no replacement: every `--rcx-button-*` hook (the colors of each kind and state, `--rcx-button-border-width`, `--rcx-button-border-radius`, `--rcx-button-ghost-*`), `--rcx-split-button-*-color`, `--rcx-input-colors-focus-shadow-color`, `--rcx-check-box-border-radius`, `--rcx-toggle-switch-border-radius`, `--rcx-chip-*`, `--rcx-badge-colors-*` and `--rcx-badge-border-radius`. Custom CSS that sets them no longer changes these components; the palette variables (`--rcx-color-*`) still do. The background of the `SplitButton` group still reads `--rcx-split-button-*background-color`.

### Visible changes

- With a root font size other than 16px, the label of a `Button` sits a few pixels higher (its block padding no longer follows the font size) and the track of a `ToggleSwitch` is half a pixel shorter.
- Text a `Chip` renders outside its label, through `renderThumb` or `renderDismissSymbol`, no longer inherits the chip's type scale.
