/**
 * Example app: "Reminders" — the composition seed.
 *
 * This file owns the app's identity (manifest), its typed settings and store,
 * and creates the env-bound `app` kit. Capability files import `app` from here
 * and use `app.slashCommand(...)`, `app.job(...)`, etc. — every handler they
 * write gets `ctx.settings` and `ctx.store` typed from the definitions below.
 *
 * (Real apps `import { z } from 'zod'`; in this offline proposal the specifier
 * resolves to a tiny shim — see examples/_vendor/zod.ts.)
 */
import { createApp, defineSettings, defineStore } from '@rocket.chat/app-sdk';
import { z } from 'zod';

export const settings = defineSettings({
	digestChannel: {
		type: 'string',
		schema: z.string(),
		i18nLabel: 'digest_channel_label',
		i18nDescription: 'digest_channel_desc',
	},
	maxRemindersPerUser: {
		type: 'number',
		schema: z.number().default(50),
		i18nLabel: 'max_reminders_label',
	},
	blockedWords: {
		type: 'string',
		schema: z.string().default(''),
		multiline: true,
		i18nLabel: 'blocked_words_label',
	},
});

export const store = defineStore({
	reminders: {
		schema: z.object({
			userId: z.string(),
			roomId: z.string(),
			text: z.string(),
			dueAt: z.string(),
			delivered: z.boolean(),
		}),
		indexes: ['userId', 'roomId'],
	},
});

export const app = createApp({
	manifest: {
		id: '5d5f4b3a-6b0e-4a1d-9c2f-8e7a1b2c3d4e',
		name: 'Reminders',
		nameSlug: 'reminders',
		version: '1.0.0',
		description: 'Set reminders, get a daily digest, and keep channels clean.',
		author: { name: 'Rocket.Chat', homepage: 'https://rocket.chat' },
		permissions: ['message.write', 'message.read', 'room.read', 'scheduler', 'persistence', 'ui.interact', 'apis', 'networking'],
	},
	settings,
	store,
});
