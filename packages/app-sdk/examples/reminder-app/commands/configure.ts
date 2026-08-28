/**
 * Interactive modal via suspend/resume — the headline UX improvement.
 *
 * `await ctx.ui.open(modal, ...)` shows the modal and suspends this handler. The
 * user's submit arrives later as a *separate* interaction request (possibly in a
 * different process); the runtime resumes this exact `await` with the validated,
 * typed form values. No `executeViewSubmitHandler`, no `viewId` bookkeeping, no
 * stashing state in persistence between callbacks.
 */
import { app } from '../app';
import { defineModal } from '@rocket.chat/app-sdk';
import { z } from 'zod';

const settingsModal = defineModal({
	title: 'Reminder settings',
	state: z.object({
		digestChannel: z.string(),
		maxReminders: z.number(),
	}),
	submit: { i18nLabel: 'save' },
	close: { i18nLabel: 'cancel' },
	render: ({ blocks, values }) => [
		blocks.section('Configure reminders for this workspace.'),
		blocks.input({
			label: 'Digest channel',
			element: blocks.textInput({ key: 'digestChannel', placeholder: '#general', initialValue: values?.digestChannel }),
		}),
		blocks.input({
			label: 'Max reminders per user',
			element: blocks.textInput({ key: 'maxReminders', placeholder: '50' }),
		}),
	],
});

export const configure = app.slashCommand({
	command: 'reminders-config',
	i18nDescription: 'reminders_config_desc',
	permission: 'ui.interact',
	async run(ctx) {
		if (!ctx.triggerId) {
			return;
		}

		const result = await ctx.ui.open(settingsModal, { triggerId: ctx.triggerId, user: ctx.sender });

		if (!result.submitted) {
			return; // user closed the modal
		}

		// result.values is typed { digestChannel: string; maxReminders: number }
		await ctx.settings.set('digestChannel', result.values.digestChannel);
		await ctx.settings.set('maxRemindersPerUser', result.values.maxReminders);
		await ctx.notify.user(ctx.sender, { room: ctx.room, text: '✅ Settings saved.' });
	},
});
