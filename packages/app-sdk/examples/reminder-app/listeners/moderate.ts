/**
 * One listener replaces three legacy interfaces.
 *
 * Legacy would need `IPreMessageSentPrevent` (to block) AND
 * `IPreMessageSentModify` (to redact) — two classes, two `implements[]` entries,
 * two `execute…`/`check…` method pairs. Here intent is the return value:
 *
 *   - `return ctx.prevent(reason)`  → block the message (was IPreMessageSentPrevent)
 *   - `return ctx.modify(newMsg)`   → rewrite the message (was IPreMessageSentModify)
 *   - `return` nothing              → allow unchanged
 *
 * `ctx.data` is typed to the event; `ctx.prevent`/`ctx.modify` only exist here
 * because `message.beforeSent` is both preventable and modifiable.
 */
import { app } from '../app';

export const moderate = app.listener({
	event: 'message.beforeSent',
	when: { roomTypes: ['channel', 'private'] }, // runtime pre-filter (was the `check…` gate)
	async handle(ctx) {
		const { message } = ctx.data; // typed: { message: IMessage }
		const text = message.text ?? '';

		const blocked = (await ctx.settings.get('blockedWords'))
			.split(',')
			.map((w) => w.trim().toLowerCase())
			.filter(Boolean);

		if (blocked.length === 0) {
			return;
		}

		const hit = blocked.find((w) => text.toLowerCase().includes(w));
		if (!hit) {
			return; // allow, unchanged
		}

		// Hard block for slurs; soft-redact otherwise — both from one handler.
		if (hit.startsWith('!')) {
			return ctx.prevent(`Message blocked: contains "${hit}".`);
		}

		const redacted = blocked.reduce((acc, w) => acc.replaceAll(new RegExp(w, 'gi'), '***'), text);
		return ctx.modify({ ...message, text: redacted });
	},
});
