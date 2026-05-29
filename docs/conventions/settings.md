# Convention: settings

**Who this is for:** a developer adding an admin-configurable setting or reading
one. **After reading:** you can register a setting and read it correctly,
avoiding the cache gotcha.

---

## Register at startup

Settings are declared through the **settings registry**
(`apps/meteor/app/settings/server/SettingsRegistry.ts`). Signature:

```ts
settingsRegistry.add(id, defaultValue, options);
```

Real shape (`add(_id, value, { sorter, section, group, ...options })`). Common
options: `type`, `group`, `section`, `i18nLabel`, `i18nDescription`, `public`,
`enableQuery`, `values` (for `select`). Group related settings with
`settingsRegistry.addGroup(id, cb)` and `.with(options, cb)`.

```ts
await settingsRegistry.add('My_Feature_Enabled', false, {
  type: 'boolean',
  group: 'General',
  section: 'My Feature',
  public: true,
  i18nLabel: 'My_Feature_Enabled',
  i18nDescription: 'My_Feature_Enabled_Description',
});
```

`i18nLabel`/`i18nDescription` keys must exist in the i18n files
(`packages/i18n`).

## Read a setting

```ts
import { settings } from '../../settings/server';

const enabled = settings.get('My_Feature_Enabled');   // cached, fast, sync-ish
```

> **Gotcha:** `settings.get()` reads an in-memory **cache** that can briefly lag
> the database. When you need a guaranteed-fresh value (e.g. right after a write
> from another process), read the model instead. Don't sprinkle DB reads where
> the cache is fine — the cache exists for a reason.

React to changes with `settings.watch(id, cb)` / `settings.watchMultiple(...)`
rather than polling.

## Environment overrides

Operators can override at boot via env vars:
`SETTINGS_BLOCKED`, `SETTINGS_HIDDEN`, `SETTINGS_REQUIRED_ON_WIZARD`,
and `OVERWRITE_SETTING_<id>`. Keep this in mind when a setting "won't change" in
a given environment — it may be blocked/overwritten.

---

**Next:** [models](./models.md) · [error-handling](./error-handling.md)
