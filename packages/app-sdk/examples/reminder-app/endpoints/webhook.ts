/**
 * An inbound webhook endpoint.
 *
 * Exposed at `/api/apps/public/{appId}/reminders` (URL scheme unchanged from
 * today). The body is validated against `bodySchema` before `handler` runs, so
 * `ctx.body` is typed — legacy `request.content` is `any`.
 */
import { app } from '../app';
import { z } from 'zod';

export const webhook = app.endpoint({
	path: '/reminders',
	method: 'POST',
	visibility: 'public',
	auth: 'none',
	bodySchema: z.object({
		roomName: z.string(),
		userId: z.string(),
		text: z.string(),
		inMinutes: z.number(),
	}),
	async handler(ctx) {
		const { roomName, userId, text, inMinutes } = ctx.body; // typed

		const room = await ctx.rooms.getByName(roomName);
		if (!room) {
			return ctx.json({ error: `unknown room: ${roomName}` }, 404);
		}

		const dueAt = new Date(Date.now() + inMinutes * 60_000);
		const id = await ctx.store.reminders.insert({
			userId,
			roomId: room.id,
			text,
			dueAt: dueAt.toISOString(),
			delivered: false,
		});

		return ctx.json({ ok: true, reminderId: id }, 201);
	},
});
