---
'@rocket.chat/ui-contexts': minor
'@rocket.chat/ui-client': minor
'@rocket.chat/mock-providers': minor
'@rocket.chat/meteor': patch
---

Splits the current modal out of `ModalContext` into a new `CurrentModalContext`, so opening or closing a modal no longer re-renders every component that calls `useSetModal`. `useSetModal`, `useModal` and `useCurrentModal` keep their signatures.
