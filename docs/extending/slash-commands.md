# Extending: slash commands

**Who this is for:** a developer adding a `/command` to the composer. **After
reading:** you can register one with the real API and know where built-ins live.

---

## Register

Two registries — **server**: `apps/meteor/server/lib/utils/slashCommand.ts`;
**client**: `apps/meteor/app/utils/client/slashCommand.ts` (what determines
`clientOnly` behavior). Both expose `slashCommands.add({...})`.

```ts
// from apps/meteor/server/slashcommands/<name>/server.ts
import { slashCommands } from '../../lib/utils/slashCommand';

slashCommands.add({
  command: 'mycommand',
  callback: async ({ command, params, message, userId }) => {
    // params is the raw argument string; message has rid, etc.
  },
  options: {
    description: 'My_Command_Description',  // i18n key
    params: 'my_command_params',            // i18n key, shown as hint
    permission: 'send-messages',            // optional
    clientOnly: false,
  },
  providesPreview: false,
});
```

Param object fields (from `ISlashCommandAddParams`): `command`, `callback`,
`options`, `result`, `providesPreview`, `previewer`, `previewCallback`, `appId`,
`description`.

## Convention: one module per command

Built-in **server handlers** live in `apps/meteor/server/slashcommands/<name>/`
(e.g. `kick/`, `join/`, `msg/`); **client registrations** remain in
`apps/meteor/app/slashcommands-<name>/client/`. Follow that layout for a new
command rather than piling into a shared file.

## Notes

- `description`/`params` are **i18n keys**, not literal strings — add them to
  `packages/i18n`.
- Set `permission` so the command is gated; don't re-check by hand in the
  callback unless the logic is more complex.
- A command with a **preview** (e.g. giphy) sets `providesPreview: true` and
  implements `previewer` + `previewCallback`.
- Apps can register slash commands too (`appId` set) — see
  [apps-engine](./apps-engine.md).

---

**Next:** [apps-engine](./apps-engine.md) ·
[integrations-webhooks](./integrations-webhooks.md)
