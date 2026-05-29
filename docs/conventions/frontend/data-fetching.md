# Convention: data fetching (client → server)

**Who this is for:** a developer calling the server from React. **After
reading:** you fetch with the typed endpoint hook + React Query, and know what's
legacy.

---

## `useEndpoint` + React Query

Call REST endpoints through **`useEndpoint`** (`@rocket.chat/ui-contexts`). It
returns a **fully typed** async function — params and result types come from
`@rocket.chat/rest-typings`, so the call is type-checked end-to-end.

```ts
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

const getStatuses = useEndpoint('GET', '/v1/custom-user-status.list');

const { data, isLoading, isError } = useQuery({
  queryKey: ['custom-user-status', { count, name }],
  queryFn: () => getStatuses({ count, name }),
});
```

- **Reads → `useQuery`**. **Writes → `useMutation`**, then invalidate the
  affected `queryKey`.
- `useEndpoint('METHOD', '/v1/path', urlParams?)` — pass URL params (e.g. an
  `:id`) as the third arg; query/body params go to the returned function.
- React Query client: `apps/meteor/client/lib/queryClient.ts`. Don't create your
  own; use the shared one via the provider.
- Pass `AbortSignal` through `{ signal }` for cancelable requests.

## Query key discipline

Use **stable, structured** query keys (`['resource', params]`) so mutations can
invalidate precisely. Don't stringify ad-hoc — inconsistent keys break cache
invalidation.

## Legacy: `useMethod`

`useMethod` (also from `ui-contexts`) calls a **Meteor method over DDP**. It's
**legacy** — present because not everything is migrated. For new code, use
`useEndpoint` (REST). See
[realtime-and-ddp](../../architecture/realtime-and-ddp.md).

## Real-time updates

For data that changes live, you still **fetch** via `useEndpoint`; live updates
arrive as **streamer events** which you apply to local state / invalidate
queries. The streamer is not a collection mirror — see
[realtime-and-ddp](../../architecture/realtime-and-ddp.md).

## Errors & feedback

Surface failures with the toast dispatcher
(`useToastMessageDispatch` from `ui-contexts`); don't swallow errors. Server
error codes follow `error-<domain>-<issue>` (see
[backend/error-handling](../backend/error-handling.md)).

---

**Next:** [contexts-and-hooks](./contexts-and-hooks.md) ·
[backend/rest-endpoints](../backend/rest-endpoints.md)
