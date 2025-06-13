/**
 * Matrix Federation API Specification
 * Based on the Matrix Specification v1.7
 * See: https://spec.matrix.org/v1.7/server-server-api/
 */

import { z } from 'zod';

// Common types
export const EventIdSchema = z.string().regex(/^\$[A-Za-z0-9_-]+$/);
export const RoomIdSchema = z
	.string()
	.regex(/^![A-Za-z0-9_-]+:[A-Za-z0-9.-]+\.[A-Za-z]+$/);
export const UserIdSchema = z
	.string()
	.regex(/^@[A-Za-z0-9_=/.+-]+:[A-Za-z0-9.-]+\.[A-Za-z]+$/);
export const ServerNameSchema = z.string().regex(/^[A-Za-z0-9.-]+\.[A-Za-z]+$/);

// Federation API endpoints
export const FederationEndpoints = {
	// Server discovery and authentication
	wellKnownServer: '/.well-known/matrix/server',
	keyServer: '/_matrix/key/v2/server',

	// Version information
	version: '/_matrix/federation/v1/version',

	// Querying room state and events
	getStateIds: (roomId: string) => `/_matrix/federation/v1/state_ids/${roomId}`,
	getState: (roomId: string) => `/_matrix/federation/v1/state/${roomId}`,
	getEvent: (eventId: string) =>
		`/_matrix/federation/v1/event/${encodeURIComponent(eventId)}`,
	getEventAuth: (roomId: string, eventId: string) =>
		`/_matrix/federation/v1/event_auth/${roomId}/${encodeURIComponent(eventId)}`,

	// Room backfill and missing events
	getMissingEvents: (roomId: string) =>
		`/_matrix/federation/v1/get_missing_events/${roomId}`,
	backfill: (roomId: string) => `/_matrix/federation/v1/backfill/${roomId}`,

	// Joining/inviting and leaving rooms
	makeJoin: (roomId: string, userId: string) =>
		`/_matrix/federation/v1/make_join/${roomId}/${userId}`,
	sendJoin: (roomId: string, eventId: string) =>
		`/_matrix/federation/v1/send_join/${roomId}/${eventId}`,
	sendJoinV2: (roomId: string, eventId: string) =>
		`/_matrix/federation/v2/send_join/${roomId}/${eventId}`,
	makeLeave: (roomId: string, userId: string) =>
		`/_matrix/federation/v1/make_leave/${roomId}/${userId}`,
	sendLeave: (roomId: string, eventId: string) =>
		`/_matrix/federation/v1/send_leave/${roomId}/${eventId}`,
	invite: (roomId: string, eventId: string) =>
		`/_matrix/federation/v1/invite/${roomId}/${eventId}`,
	inviteV2: (roomId: string, eventId: string) =>
		`/_matrix/federation/v2/invite/${roomId}/${eventId}`,

	// Sending events
	sendTransaction: (txnId: string) => `/_matrix/federation/v1/send/${txnId}`,

	// User and profile data
	queryProfile: (_userId: string) => '/_matrix/federation/v1/query/profile',
	userDevices: (userId: string) =>
		`/_matrix/federation/v1/user/devices/${userId}`,

	// Public room directory
	publicRooms: '/_matrix/federation/v1/publicRooms',
};

// Schema types for request/response bodies
export const VersionResponseSchema = z.object({
	server: z.object({
		name: z.string(),
		version: z.string(),
	}),
});

export const StateIdsResponseSchema = z.object({
	pdu_ids: z.array(EventIdSchema),
	auth_chain_ids: z.array(EventIdSchema),
});

export const StateResponseSchema = z.object({
	pdus: z.array(z.any()), // Event objects
	auth_chain: z.array(z.any()), // Auth events
});

export const RoomVersionSchema = z.union([
	z.literal('1'),
	z.literal('2'),
	z.literal('3'),
	z.literal('4'),
	z.literal('5'),
	z.literal('6'),
	z.literal('7'),
	z.literal('8'),
	z.literal('9'),
	z.literal('10'),
	z.literal('11'),
]);

export const MakeJoinEventSchema = z.object({
	content: z.object({
		membership: z.literal('join'),
		join_authorised_via_users_server: z.string().optional(),
	}),
	origin: z.string(),
	origin_server_ts: z.number(),
	sender: z.string(),
	state_key: z.string(),
	type: z.literal('m.room.member'),
});

export const MakeJoinResponseSchema = z.object({
	room_version: RoomVersionSchema,
	event: MakeJoinEventSchema,
});

export const SendJoinEventSchema = z.object({
	auth_events: z.array(z.string()),
	content: z.object({
		membership: z.literal('join'),
		join_authorised_via_users_server: z.string().optional(),
	}),
	depth: z.number(),
	hashes: z.object({
		sha256: z.string(),
	}),
	origin: z.string(),
	origin_server_ts: z.number(),
	prev_events: z.array(z.string()),
	room_id: RoomIdSchema,
	sender: UserIdSchema,
	signatures: z.record(z.string(), z.record(z.string(), z.string())),
	state_key: z.string(),
	type: z.literal('m.room.member'),
	unsigned: z
		.object({
			age: z.number().optional(),
		})
		.optional(),
});

export const SendJoinResponseSchema = z.object({
	state: z.array(z.any()),
	auth_chain: z.array(z.any()),
	event_id: EventIdSchema.optional(),
	event: SendJoinEventSchema.optional(),
	origin: z.string().optional(),
	members_omitted: z.boolean().optional(),
	servers_in_room: z.array(z.string()).optional(),
});

export const TransactionSchema = z.object({
	origin: ServerNameSchema,
	origin_server_ts: z.number(),
	pdus: z.array(z.any()),
	edus: z.array(z.any()).optional(),
});

export const SendTransactionResponseSchema = z.object({
	pdus: z.record(
		z.object({
			error: z.string().optional(),
		}),
	),
});

export type Version = z.infer<typeof VersionResponseSchema>;
export type StateIds = z.infer<typeof StateIdsResponseSchema>;
export type State = z.infer<typeof StateResponseSchema>;
export type MakeJoinEventResponseSchema = z.infer<typeof MakeJoinEventSchema>;
export type SendJoinEventResponseSchema = z.infer<typeof SendJoinEventSchema>;
export type MakeJoinResponse = z.infer<typeof MakeJoinResponseSchema>;
export type SendJoinResponse = z.infer<typeof SendJoinResponseSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type SendTransactionResponse = z.infer<
	typeof SendTransactionResponseSchema
>;
