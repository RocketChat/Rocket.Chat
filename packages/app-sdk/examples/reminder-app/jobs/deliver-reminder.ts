/**
 * A job scheduled imperatively (one-off) by the /remind command.
 *
 * `ctx.data` is typed by `inputSchema`. When the command calls
 * `ctx.scheduler.runAt(deliverReminder, dueAt, { ... })`, that data object is
 * type-checked against this same schema — passing the job by value is what makes
 * that possible (legacy `scheduleOnce({ id: 'deliver', data })` took an untyped
 * bag and a stringly-typed id).
 */
import { app } from '../app';
import { z } from 'zod';

export const deliverReminder = app.job({
	id: 'deliver-reminder',
	inputSchema: z.object({
		reminderId: z.string(),
		roomId: z.string(),
		userId: z.string(),
		text: z.string(),
	}),
	async run(ctx) {
		const { reminderId, roomId, userId, text } = ctx.data; // fully typed

		const reminder = await ctx.store.reminders.get(reminderId);
		if (!reminder || reminder.delivered) {
			return; // already handled / cancelled
		}

		await ctx.messages.send({
			room: roomId,
			text: `⏰ Reminder for <@${userId}>: ${text}`,
		});

		await ctx.store.reminders.update(reminderId, { delivered: true });
		ctx.logger.info('delivered reminder', reminderId);
	},
});
