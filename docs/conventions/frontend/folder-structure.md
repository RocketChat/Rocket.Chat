# Convention: frontend folder structure

**Who this is for:** a developer adding or moving React code in `apps/meteor`.
**After reading:** you know where a component/hook/lib goes and the colocation
rule the team follows.

> Source of truth in-repo: `apps/meteor/client/README.md`. This expands on it.

---

## Colocate first, promote later

**Start code where it's used.** Build your component/hook/lib inside the folder
of the feature that uses it. Only when something is needed in **more than one
place** do you "promote" it up to a shared level. Don't pre-emptively put things
in the global `components/` or `hooks/`.

## Structure follows UI semantics

Folders mirror the app's UI tree (room → header / contextualbar / sidebar → …),
not technical layers. A feature folder is typically:

```
<feature>/
├── index.tsx               # entry
├── <Feature>.tsx           # container component
├── components/   (optional) # presentational pieces used here
├── hooks/        (optional) # hooks used here
├── contexts/     (optional)
├── providers/    (optional)
└── lib/          (optional)
```

## Where the shared levels live (`apps/meteor/client/`)

| Dir | Use |
|-----|-----|
| `views/` | top-level screens/areas (admin, room, account, …) |
| `sidebar/`, `navbar/` | chrome around the room |
| `components/` | **shared** presentational components |
| `hooks/` | **shared** hooks |
| `contexts/`, `providers/` | cross-cutting React contexts |
| `lib/` | shared client utilities (e.g. `lib/queryClient.ts`) |
| `stores/`, `cachedStores/` | client-side state/caches |
| `uikit/` | UIKit (Apps) rendering on the client |

## Blaze bridge (legacy)

The UI is mostly React, but some spots still render inside the legacy **Blaze**
environment. The migration is ongoing; when you must render a React component
under Blaze, use the project's Blaze→React bridge helper (see
`apps/meteor/client/README.md`). Don't add new Blaze templates.

---

**Next:** [components-and-styling](./components-and-styling.md) ·
[data-fetching](./data-fetching.md)
