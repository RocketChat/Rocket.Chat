# Convention: contexts & hooks (`@rocket.chat/ui-contexts`)

**Who this is for:** a developer who needs settings, permissions, translations,
routing, or the current user in a React component. **After reading:** you use the
canonical hooks instead of reaching into globals.

---

## Get everything through `ui-contexts`

`@rocket.chat/ui-contexts` is the React boundary to the app's runtime. Use its
hooks rather than importing server/meteor globals into components — this keeps
components testable (the contexts are mockable, see
`apps/meteor/client/stories/contexts/`).

| Need | Hook |
|------|------|
| Translate text | `useTranslation` |
| Read a setting | `useSetting(id)` |
| Check a permission | `usePermission(p)` / `useAtLeastOnePermission` / `useAllPermissions` |
| Current user | `useUserId`, `useUser` |
| Routing | `useRouter`, `useRouteParameter`, `useCurrentRoutePath` |
| Modals | `useSetModal`, `useModal` |
| Toasts | `useToastMessageDispatch` |
| Call server | `useEndpoint` (REST) / `useMethod` (legacy DDP) |
| Layout | `useLayout` |

## Translations

```ts
const t = useTranslation();
t('My_i18n_Key');
```

Keys live in `@rocket.chat/i18n` (`packages/i18n`). **Never hardcode
user-visible strings** — add a key and translate. Settings, slash commands, and
admin labels all reference i18n keys too.

## Permissions in the UI

Gate UI with `usePermission` — but remember the **client check is for UX only**.
The server still enforces via `permissionsRequired` on the endpoint
([backend/rest-endpoints](../backend/rest-endpoints.md)). Never rely on hiding a
button as a security boundary.

## Settings in the UI

`useSetting(id)` reflects the same registry as the backend
([backend/settings](../backend/settings.md)). It's reactive — the component
re-renders when the setting changes.

## Custom hooks

When logic is reused, extract a hook — colocated first, promoted to
`client/hooks/` only when shared (see
[folder-structure](./folder-structure.md)). Reuse `@rocket.chat/fuselage-hooks`
utilities instead of re-implementing debouncing, stable callbacks, ids, etc.

---

**Next:** [components-and-styling](./components-and-styling.md) ·
[data-fetching](./data-fetching.md)
