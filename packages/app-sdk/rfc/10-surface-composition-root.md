# The composition root

> Part of the [Apps Engine SDK RFC](README.md).

**Legacy**

```ts
export class RemindersApp extends App {
  protected async extendConfiguration(c: IConfigurationExtend) {
    await c.slashCommands.provideSlashCommand(new RemindCommand());
    await c.scheduler.registerProcessors([new DeliverProcessor()]);
    await c.settings.provideSetting({ id: 'digestChannel', type: SettingType.STRING, /* … */ });
    await c.api.provideApi({ visibility: ApiVisibility.PUBLIC, endpoints: [new WebhookEndpoint()] });
  }
  async onEnable(env: IEnvironmentRead, cm: IConfigurationModify): Promise<boolean> { /* … */ return true; }
}
```

**Proposed** — declarative, mirroring `new Mastra({ … })`. Full file:
[`examples/reminder-app/index.ts`](../examples/reminder-app/index.ts).

```ts
import { app } from './app';                 // the env-bound kit
import { remind, configure } from './commands';
import { dailyDigest, deliverReminder } from './jobs';
import { moderate } from './listeners/moderate';
import { webhook } from './endpoints/webhook';

export default app.build({
  commands: [remind, configure],
  jobs: [dailyDigest, deliverReminder],
  listeners: [moderate],
  endpoints: [webhook],
  lifecycle: {
    async onEnable(ctx) {
      if (!(await ctx.settings.get('digestChannel'))) return false; // refuse until configured
      return true;
    },
  },
});
```

The `app` kit is created once, seeded with the manifest, settings and store, so
every definition it produces gets typed `ctx.settings` and `ctx.store`
([`examples/reminder-app/app.ts`](../examples/reminder-app/app.ts)):

```ts
export const settings = defineSettings({
  digestChannel:       { type: 'string', schema: z.string(),           i18nLabel: 'digest_channel_label' },
  maxRemindersPerUser: { type: 'number', schema: z.number().default(50), i18nLabel: 'max_reminders_label' },
});

export const store = defineStore({
  reminders: {
    schema: z.object({ userId: z.string(), roomId: z.string(), text: z.string(), dueAt: z.string(), delivered: z.boolean() }),
    indexes: ['userId', 'roomId'],
  },
});

export const app = createApp({ manifest: { /* app.json in code */ }, settings, store });
```

Two styles are supported, both compiling in the examples:

- **`createApp({ manifest, settings, store })`** returns a kit
  (`app.slashCommand`, `app.job`, …) pre-bound to the app's inferred env — full
  end-to-end typing. Recommended.
- **`defineApp({ manifest, commands, jobs, … })`** with standalone `define*`
  factories — no central kit, handy for small apps or shared libraries
  ([`examples/standalone-video-conf.ts`](../examples/standalone-video-conf.ts)).

