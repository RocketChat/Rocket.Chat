# Sidebar search triggers `spotlight` RPC for empty or whitespace-only queries

## Summary
The sidebar search flow can call the backend `spotlight` method even when the user has not entered a meaningful search term (empty input or whitespace-only input).

This generates unnecessary server traffic and may return broad/noisy results before the user provides search intent.

## Environment
- Product: Rocket.Chat web client
- Area: Sidebar search (`NavBarSearch`)
- Client hook: `useSearchItems`
- File: `apps/meteor/client/navbar/NavBarSearch/hooks/useSearchItems.ts`

## Problem details
In the current search flow, the query function may invoke `spotlight` whenever local room results are below the configured limit, even for blank terms.

This means opening the search UI and leaving it empty (or typing spaces) can still trigger backend calls.

## Impact
- Unnecessary backend load from avoidable `spotlight` RPC requests.
- Increased network activity from idle/blank searches.
- Potentially confusing search results before users type a real term.

## Steps to reproduce
1. Open the workspace sidebar search.
2. Keep the query empty or type only whitespace (e.g. `'   '`).
3. Inspect network / method traffic.
4. Observe that `spotlight` can be called despite no meaningful term.

## Current behavior
- Empty/whitespace input may still trigger remote search (`spotlight`).

## Expected behavior
- Empty/whitespace input should return local results only.
- `spotlight` should only execute when the normalized search term is non-empty.

## Suggested fix
1. Normalize search input with `trim()`.
2. Short-circuit the search query function when the normalized term is empty.
3. Return local room results without calling `spotlight` in that case.
4. Ensure query key and exact-match logic use normalized input consistently.

## Acceptance criteria
- [ ] No `spotlight` request is sent for empty input.
- [ ] No `spotlight` request is sent for whitespace-only input.
- [ ] Existing behavior for non-empty search terms remains unchanged.
- [ ] Mention filters (`@`/`#`) continue working as before for non-empty input.

## Scope note
This issue specifically targets sidebar search behavior in `useSearchItems`; it does not propose changes to global search behavior outside that hook.
