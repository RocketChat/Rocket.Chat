import { z } from 'zod';

// Base event schema
export const baseEventSchema = z.object({
	type: z.string(),
	sender: z.string(),
	room_id: z.string(),
	origin: z.string(),
	origin_server_ts: z.number(),
	content: z.record(z.any()),
	unsigned: z.record(z.any()).optional(),
	event_id: z.string().optional(),
	state_key: z.string().optional(),
	prev_events: z.array(z.string()).optional(),
	auth_events: z.array(z.string()).optional(),
	depth: z.number().optional(),
});

// Message event schema
export const messageEventSchema = baseEventSchema.extend({
	type: z.literal('m.room.message'),
	content: z.object({
		msgtype: z.string(),
		body: z.string(),
		format: z.string().optional(),
		formatted_body: z.string().optional(),
	}),
});

// Member event schema
export const memberEventSchema = baseEventSchema.extend({
	type: z.literal('m.room.member'),
	state_key: z.string(),
	content: z.object({
		membership: z.enum(['invite', 'join', 'leave', 'ban', 'knock']),
		displayname: z.string().optional(),
		avatar_url: z.string().optional(),
		reason: z.string().optional(),
	}),
});

// Create event schema
export const createEventSchema = baseEventSchema.extend({
	type: z.literal('m.room.create'),
	state_key: z.literal(''),
	content: z.object({
		creator: z.string(),
		room_version: z.string().optional(),
		predecessor: z.object({
			room_id: z.string(),
			event_id: z.string(),
		}).optional(),
	}),
});

// Power levels event schema
export const powerLevelsEventSchema = baseEventSchema.extend({
	type: z.literal('m.room.power_levels'),
	state_key: z.literal(''),
	content: z.object({
		users: z.record(z.number()).optional(),
		users_default: z.number().optional(),
		events: z.record(z.number()).optional(),
		events_default: z.number().optional(),
		state_default: z.number().optional(),
		ban: z.number().optional(),
		kick: z.number().optional(),
		redact: z.number().optional(),
		invite: z.number().optional(),
	}),
});

// Generic event validation
export function validateEvent(event: unknown): z.infer<typeof baseEventSchema> {
	return baseEventSchema.parse(event);
}

export function validateMessageEvent(event: unknown): z.infer<typeof messageEventSchema> {
	return messageEventSchema.parse(event);
}

export function validateMemberEvent(event: unknown): z.infer<typeof memberEventSchema> {
	return memberEventSchema.parse(event);
}