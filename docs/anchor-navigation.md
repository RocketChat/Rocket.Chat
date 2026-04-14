# Anchor Navigation

This document describes the pattern for navigating directly to a specific field within a page using URL hash fragments (e.g., `/account/accessibility-and-appearance#clockMode`).

## Problem

Rocket.Chat uses a custom SPA router that intercepts link clicks via `e.preventDefault()` and navigates with `history.pushState()`. This means the browser's native hash-based scrolling does not work for cross-page navigation. When a user clicks a link like `/page-b#field`, the router renders the new page but does not scroll to the target element.

## Solution

Scrolling to hash targets is handled automatically by `RouterProvider` via `useRouterScrollToHash`. It only scrolls to elements whose `id` matches a registered anchor in `TARGET_ANCHORS` — unregistered hashes are ignored.

For pages that need to adjust layout based on the hash (e.g., expanding an accordion section), `useHasValidLocationHash` returns whether the current hash matches a registered anchor.

### Key files

| File | Purpose |
|------|---------|
| `apps/meteor/client/hooks/useRouterScrollToHash.ts` | Scroll logic + `TARGET_ANCHORS` definition (called by `RouterProvider`) |
| `apps/meteor/client/hooks/useHasValidLocationHash.ts` | Context-based hook for pages to check hash validity |
| `packages/ui-contexts/src/hooks/useLocationHash.ts` | Generic `useLocationHash()` hook from `@rocket.chat/ui-contexts` |

## How it works

1. A **source page** links to a target page with a hash fragment in the `href`
2. The **target page** renders elements with matching `id` attributes
3. `useRouterScrollToHash` (in `RouterProvider`) checks if the hash matches a `TARGET_ANCHORS` entry and scrolls to the element via `scrollIntoView`
4. If the target page needs to adjust layout (e.g., expand a collapsed section), it calls `useHasValidLocationHash()` to check if the hash is valid

```text
PreferencesMessagesSection                      AccessibilityPage
┌──────────────────────────┐                   ┌──────────────────────────┐
│ Message TimeFormat        │                   │ Adjustable layout        │
│ [Go to accessibility] ────┼── #clockMode ───> │  <Field id="clockMode">  │
│                           │                   │                          │
│ Hide usernames            │                   │  <Field id="hideUsernames">  │
│ [Go to accessibility] ────┼── #hideUsernames ───> │                          │
└──────────────────────────┘                   └──────────────────────────┘
```

## Usage

### 1. Register the anchor in `TARGET_ANCHORS`

Add your field key to `TARGET_ANCHORS` in `useRouterScrollToHash.ts`. This registers it for both scrolling and hash validation.

```ts
// apps/meteor/client/hooks/useRouterScrollToHash.ts

export const TARGET_ANCHORS = {
  clockMode: 'clockMode',
  hideUsernames: 'hideUsernames',
  hideRoles: 'hideRoles',
  // Add new anchors here
  myNewField: 'myNewField',
} as const;
```

### 2. Add the `id` to the target element

On the destination page, set the `id` on the element you want to scroll to:

```tsx
import { TARGET_ANCHORS } from '../../../hooks/useHasValidLocationHash';

<Field id={TARGET_ANCHORS.myNewField}>
  <FieldLabel>{t('My_New_Field')}</FieldLabel>
  {/* ... */}
</Field>
```

### 3. Call the hook in the target page (if layout adjustment is needed)

If the target field is inside a collapsed section, you can call `useHasValidLocationHash()` and control the section's visibility:

```tsx
import { TARGET_ANCHORS, useHasValidLocationHash } from '../../../hooks/useHasValidLocationHash';

const MyPage = () => {
  const shouldExpand = useHasValidLocationHash();

  return (
    <Accordion>
      <AccordionItem defaultExpanded={shouldExpand} title={t('Section')}>
        <Field id={TARGET_ANCHORS.myNewField}>
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
import { TARGET_ANCHORS } from '../../../hooks/useHasValidLocationHash';

<FieldLink href={`/account/accessibility-and-appearance#${TARGET_ANCHORS.myNewField}`}>
  {t('Go_to_accessibility_and_appearance')}
</FieldLink>
```

## Extending to other pages

To add anchor navigation to a different page:

1. Add the field key to `TARGET_ANCHORS` in `useRouterScrollToHash.ts`
2. Set `id={TARGET_ANCHORS.key}` on the target element
3. Add source links with `#key` in the `href`
4. If the target is inside a collapsed section, call `useHasValidLocationHash()` to control expansion

## Why `scrollIntoView` is needed

The browser natively scrolls to hash targets on full page loads and un-intercepted anchor clicks. However, the custom router calls `e.preventDefault()` on cross-page links and uses `history.pushState()`, which by spec does not trigger scroll. `useRouterScrollToHash` compensates by calling `scrollIntoView` after each navigation.

Same-page hash navigation (clicking `#anchor` when already on that page) still works natively — the router detects matching pathnames and lets the browser handle it.

## Checklist

When adding a new anchor:

- [ ] Key added to `TARGET_ANCHORS` in `useRouterScrollToHash.ts`
- [ ] `id` attribute set on the target element using the constant
- [ ] Source `href` includes the `#anchor` fragment using the constant
- [ ] If layout adjustment is needed: `useHasValidLocationHash()` called in target page to control `defaultExpanded`
