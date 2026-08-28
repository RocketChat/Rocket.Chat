/**
 * Slash command with typed, schema-parsed arguments.
 *
 * Usage: `/remind me 30 Stand-up starts`  →  args = { who:'me', minutes:30, text:'Stand-up starts' }
 *
 * The runtime parses the raw input against `arguments` (positional fields in
 * declared order, trailing string captures the rest) and hands you a typed
 * `ctx.args`. Compare to legacy, where you get `context.getArguments(): string[]`
 * and parse/validate by hand every time.
 */
import { app } from '../app';
import { deliverReminder } from '../jobs/deliver-reminder';
import { z } from 'zod';

export const remind = app.slashCommand({
	command: 'remind',
	i18nDescription: 'remind_command_desc',
	i18nParamsExample: 'remind_command_example',
	permission: 'message.write',
	arguments: z.object({
		who: z.string().describe('who to remind (username or "me")'),
		minutes: z.number().describe('minutes from now'),
		text: z.string().describe('reminder text'),
	}),
	async run(ctx) {
		const { who, minutes, text } = ctx.args; // typed: { who: string; minutes: number; text: string }

		const max = await ctx.settings.get('maxRemindersPerUser'); // typed: number
		const existing = await ctx.store.reminders.find({ userId: ctx.sender, delivered: false });
		if (existing.length >= max) {
			await ctx.notify.user(ctx.sender, { room: ctx.room, text: `You already have ${max} pending reminders.` });
			return;
		}

		const targetUser = who === 'me' ? ctx.sender : (await ctx.users.getByUsername(who))?.id;
		if (!targetUser) {
			await ctx.notify.user(ctx.sender, { room: ctx.room, text: `Unknown user: ${who}` });
			return;
		}

		const dueAt = new Date(Date.now() + minutes * 60_000);
		const reminderId = await ctx.store.reminders.insert(
			{ userId: targetUser, roomId: ctx.room, text, dueAt: dueAt.toISOString(), delivered: false },
			{ associations: [{ model: 'room', id: ctx.room }] }, // cascade-cleaned if the room is deleted
		);

		// Imperative one-off schedule; `data` is type-checked against deliverReminder.inputSchema.
		await ctx.scheduler.runAt(deliverReminder, dueAt, {
			reminderId,
			roomId: ctx.room,
			userId: targetUser,
			text,
		});

		await ctx.notify.user(ctx.sender, { room: ctx.room, text: `✅ Reminder set for ${minutes} min from now.` });
	},
});
