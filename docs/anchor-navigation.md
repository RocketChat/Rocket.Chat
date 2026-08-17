# Anchor Navigation

This document describes the pattern for navigating directly to a specific field within a page using URL hash fragments (e.g., `/account/accessibility-and-appearance#clockMode`).

## Problem

Rocket.Chat uses a custom SPA router that intercepts link clicks via `e.preventDefault()` and navigates with `history.pushState()`. This means the browser's native hash-based scrolling does not work for cross-page navigation. When a user clicks a link like `/page-b#field`, the router renders the new page but does not scroll to the target element.

## Solution

Scrolling to hash targets is handled automatically by `RouterProvider` via `useRouterScrollToHash`. Any element with an `id` matching the URL hash will be scrolled into view on navigation.

For pages that need to adjust layout based on the hash (e.g., expanding an accordion section), `useLocationHash()` from `@rocket.chat/ui-contexts` provides the current hash value.

### Key files

| File | Purpose |
|------|---------|
| `apps/meteor/client/hooks/useRouterScrollToHash.ts` | Scroll logic, called by `RouterProvider` |
| `packages/ui-contexts/src/hooks/useLocationHash.ts` | Generic `useLocationHash()` hook from `@rocket.chat/ui-contexts` |

## How it works

1. A **source page** links to a target page with a hash fragment in the `href`
2. The **target page** renders elements with matching `id` attributes
3. `useRouterScrollToHash` (in `RouterProvider`) scrolls to the element matching the hash via `scrollIntoView`
4. If the target page needs to adjust layout (e.g., expand a collapsed section), it reads `useLocationHash()` to check if a hash is present

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

### 1. Add the `id` to the target element

On the destination page, set the `id` on the element you want to scroll to:

```tsx
<Field id='myNewField'>
  <FieldLabel>{t('My_New_Field')}</FieldLabel>
  {/* ... */}
</Field>
```

### 2. Expand collapsed sections (if needed)

If the target field is inside a collapsed section, use `useLocationHash()` to expand it:

```tsx
import { useLocationHash } from '@rocket.chat/ui-contexts';

const MyPage = () => {
  const shouldExpand = useLocationHash().length > 1;

  return (
    <Accordion>
      <AccordionItem defaultExpanded={shouldExpand} title={t('Section')}>
        <Field id='myNewField'>
          {/* ... */}
        </Field>
      </AccordionItem>
    </Accordion>
  );
};
```

### 3. Link from the source page

Use the hash fragment in the `href`:

```tsx
<FieldLink href='/account/accessibility-and-appearance#myNewField'>
  {t('Go_to_accessibility_and_appearance')}
</FieldLink>
```

## Why `scrollIntoView` is needed

The browser natively scrolls to hash targets on full page loads and un-intercepted anchor clicks. However, the custom router calls `e.preventDefault()` on cross-page links and uses `history.pushState()`, which by spec does not trigger scroll. `useRouterScrollToHash` compensates by calling `scrollIntoView` after each navigation.

Same-page hash navigation (clicking `#anchor` when already on that page) still works natively — the router detects matching pathnames and lets the browser handle it.

## Checklist

When adding a new anchor:

- [ ] `id` attribute set on the target element
- [ ] Source `href` includes the `#anchor` fragment
- [ ] `useLocationHash()` can be called in target page to identify if theres hash and control collapsed content, if layout adjustment is needed
