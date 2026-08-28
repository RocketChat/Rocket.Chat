/**
 * The app's composition root (its bundle entry).
 *
 * Everything the app contributes is registered by value in one place — the
 * declarative analogue of Mastra's `new Mastra({ agents, workflows, tools })`,
 * and the replacement for the legacy `extendConfiguration()` body. No base
 * class, no `this`, no imperative `provideX()` calls.
 */
import { app } from './app';
import { remind } from './commands/remind';
import { configure } from './commands/configure';
import { dailyDigest } from './jobs/daily-digest';
import { deliverReminder } from './jobs/deliver-reminder';
import { moderate } from './listeners/moderate';
import { webhook } from './endpoints/webhook';

export default app.build({
	commands: [remind, configure],
	jobs: [dailyDigest, deliverReminder],
	listeners: [moderate],
	endpoints: [webhook],
	lifecycle: {
		async onEnable(ctx) {
			// Refuse to enable until the digest channel is configured.
			const channel = await ctx.settings.get('digestChannel');
			if (!channel) {
				ctx.logger.warn('Reminders: set a digest channel before enabling.');
				return false;
			}
			return true;
		},
		async onSettingUpdated(ctx) {
			ctx.logger.info('setting updated', ctx.settingId);
		},
	},
});
