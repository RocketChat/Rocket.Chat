# Anchor Navigation

This document describes the pattern for navigating directly to a specific field within a page using URL hash fragments (e.g., `/account/accessibility-and-appearance#clockMode`).

## Problem

Rocket.Chat uses a custom SPA router that intercepts link clicks via `e.preventDefault()` and navigates with `history.pushState()`. This means the browser's native hash-based scrolling does not work for cross-page navigation. When a user clicks a link like `/page-b#field`, the router renders the new page but does not scroll to the target element.

## Solution

The `useScrollToHash` hook reads the URL hash on mount, scrolls to the matching element, and returns whether the hash matches a known anchor. This allows pages to both scroll to the correct field and adjust their layout (e.g., expand an accordion section).

**Hook location:** `apps/meteor/client/hooks/useScrollToHash.ts`

## How it works

1. A **source page** links to a target page with a hash fragment in the `href`
2. The **target page** renders elements with matching `id` attributes
3. `useScrollToHash` reads `window.location.hash`, scrolls to the element via `scrollIntoView`, and reports whether the hash matched a known anchor

```
PreferencesMessagesSection                      AccessibilityPage
┌──────────────────────────┐                   ┌──────────────────────────┐
│ Message TimeFormat        │                   │ Adjustable layout        │
│ [Go to accessibility] ────┼── #clockMode ───> │  <Field id="clockMode">  │
│                           │                   │                          │
│ Hide usernames            │                   │  <Field id="hideUsers">  │
│ [Go to accessibility] ────┼── #hideUsers ───> │                          │
└──────────────────────────┘                   └──────────────────────────┘
```

## Usage

### 1. Register anchors in `FIELD_ANCHORS`

Add your field key to the `FIELD_ANCHORS` map in `useScrollToHash.ts`. This is the single source of truth for all anchor IDs.

```ts
// apps/meteor/client/hooks/useScrollToHash.ts

export const FIELD_ANCHORS = {
  clockMode: 'clockMode',
  hideUsernames: 'hideUsernames',
  hideRoles: 'hideRoles',
  // Add new anchors here
  myNewField: 'myNewField',
} as const;
```

### 2. Add the `id` to the target element

On the destination page, set the `id` on the `<Field>` (or whichever wrapper you want to scroll to) using the anchor constant:

```tsx
import { FIELD_ANCHORS } from '../../../hooks/useScrollToHash';

<Field id={FIELD_ANCHORS.myNewField}>
  <FieldLabel>{t('My_New_Field')}</FieldLabel>
  {/* ... */}
</Field>
```

### 3. Call the hook in the target page

`useScrollToHash` handles the scroll and returns `shouldExpand` to indicate whether the hash matched a known anchor. Use this to control layout (e.g., expanding an accordion):

```tsx
import { useScrollToHash } from '../../../hooks/useScrollToHash';

const MyPage = () => {
  const { shouldExpand } = useScrollToHash();

  return (
    <Accordion>
      <AccordionItem defaultExpanded={shouldExpand} title={t('Section')}>
        <Field id={FIELD_ANCHORS.myNewField}>
          {/* ... */}
        </Field>
      </AccordionItem>
    </Accordion>
  );
};
```

### 4. Link from the source page

Use the anchor in the `href` hash fragment:

```tsx
import { FIELD_ANCHORS } from '../../../hooks/useScrollToHash';

<FieldLink href={`/account/accessibility-and-appearance#${FIELD_ANCHORS.myNewField}`}>
  {t('Go_to_accessibility_and_appearance')}
</FieldLink>
```

## Extending to other pages

The current implementation covers the Accessibility page, but the pattern is generic. To add anchor navigation to a different page:

1. Add the new field keys to `FIELD_ANCHORS`
2. Call `useScrollToHash()` in the target page component
3. Add `id={FIELD_ANCHORS.key}` to the target fields
4. Update source links to include `#key` in the `href`

If different pages need independent sets of anchors (e.g., to control different accordion sections), consider splitting `FIELD_ANCHORS` into page-specific maps or passing a custom set to the hook.

## Why `scrollIntoView` is needed

The browser natively scrolls to hash targets on full page loads and un-intercepted anchor clicks. However, the custom router calls `e.preventDefault()` on cross-page links and uses `history.pushState()`, which by spec does not trigger scroll. The hook compensates by calling `scrollIntoView` after the component mounts.

Same-page hash navigation (clicking `#anchor` when already on that page) still works natively — the router detects matching pathnames and lets the browser handle it.

## Checklist

When adding a new anchor:

- [ ] Key added to `FIELD_ANCHORS` in `useScrollToHash.ts`
- [ ] `id` attribute set on the target `<Field>` using the constant
- [ ] Source `href` includes the `#anchor` fragment using the constant
- [ ] `useScrollToHash()` is called in the target page
- [ ] If the target is inside a collapsed section, `shouldExpand` controls its `defaultExpanded`
- [ ] Both source and target import from the same `FIELD_ANCHORS` constant
