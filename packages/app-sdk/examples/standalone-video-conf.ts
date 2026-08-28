/**
 * The other composition style + remaining capabilities.
 *
 * The Reminders app uses the env-bound `createApp` kit (for typed
 * settings/store). This snippet shows the **standalone** style — plain
 * `define*` factories + `defineApp(...)` — which needs no central kit and is
 * handy for small apps or shared libraries of definitions. It also demonstrates
 * a video-conf provider and an action button (co-located click handler).
 */
import { defineApp, defineSlashCommand, defineVideoConfProvider } from '@rocket.chat/app-sdk';
import type { ActionButton } from '@rocket.chat/app-sdk';
import { z } from 'zod';

const roll = defineSlashCommand({
	command: 'roll',
	i18nDescription: 'roll_desc',
	arguments: z.object({ sides: z.number().default(6) }),
	async run(ctx) {
		const result = 1 + Math.floor(Math.random() * ctx.args.sides);
		await ctx.messages.send({ room: ctx.room, text: `🎲 ${result}` });
	},
});

const jitsi = defineVideoConfProvider({
	name: 'jitsi',
	capabilities: { mic: true, cam: true, title: true },
	async isConfigured(ctx) {
		return Boolean(await ctx.settings.getAll());
	},
	async generateUrl(ctx) {
		return `https://meet.jit.si/${encodeURIComponent(ctx.call.id)}`;
	},
	async customizeUrl(ctx) {
		return `${ctx.url}#userInfo.displayName=${ctx.user}`;
	},
});

// An action button that opens a modal when clicked (handler co-located with the button).
const startCall: ActionButton = {
	actionId: 'start-call',
	i18nLabel: 'start_call',
	surface: 'roomToolbar',
	when: { roomTypes: ['channel', 'private'] },
	async onClick(ctx) {
		await ctx.messages.send({ room: ctx.room!.id, text: `📞 <@${ctx.user.id}> started a call.` });
	},
};

export default defineApp({
	manifest: {
		id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
		name: 'Dice & Calls',
		nameSlug: 'dice-and-calls',
		version: '0.1.0',
		description: 'A tiny standalone-style app.',
		author: { name: 'Rocket.Chat' },
		permissions: ['message.write', 'video-conference', 'ui.interact'],
	},
	commands: [roll],
	actionButtons: [startCall],
	providers: { videoConf: [jitsi] },
});
