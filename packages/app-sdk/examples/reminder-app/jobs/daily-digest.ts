/**
 * A recurring job declared with an inline cron schedule.
 *
 * Legacy equivalent: an `IProcessor` registered via
 * `scheduler.registerProcessors([...])`, then separately scheduled with
 * `scheduler.scheduleRecurring({ id, interval, data })`. Here the schedule is
 * declared inline on the job (mirrors Mastra's `createWorkflow({ schedule:
 * { cron } })`); the runtime registers it when the app is enabled.
 */
import { app } from '../app';

export const dailyDigest = app.job({
	id: 'daily-digest',
	schedule: { cron: '0 9 * * *', timezone: 'UTC' },
	async run(ctx) {
		const channel = await ctx.settings.get('digestChannel'); // typed: string
		if (!channel) {
			return;
		}

		const room = await ctx.rooms.getByName(channel);
		if (!room) {
			ctx.logger.warn('digest channel not found', channel);
			return;
		}

		const pending = await ctx.store.reminders.find({ delivered: false });
		await ctx.messages.send({
			room: room.id,
			text: `📋 Daily digest: ${pending.length} reminder(s) still pending.`,
		});
	},
});
