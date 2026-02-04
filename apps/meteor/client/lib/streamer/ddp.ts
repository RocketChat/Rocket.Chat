import * as z from 'zod/mini';

/**
 * DDP Message Specification
 * https://github.com/meteor/meteor/blob/devel/packages/ddp/DDP.md
 */

// Establishing connection
const ConnectSchema = z.strictObject({
	msg: z.literal('connect'),
	session: z.optional(z.string()),
	version: z.string(),
	support: z.array(z.string()),
});

const ConnectedSchema = z.strictObject({
	msg: z.literal('connected'),
	session: z.string(),
});

const FailedSchema = z.strictObject({
	msg: z.literal('failed'),
	version: z.string(),
});

// Heartbeats
const PingSchema = z.strictObject({
	msg: z.literal('ping'),
	id: z.optional(z.string()),
});

const PongSchema = z.strictObject({
	msg: z.literal('pong'),
	id: z.optional(z.string()),
});

// Managing data
const AddedSchema = z.strictObject({
	msg: z.literal('added'),
	collection: z.string(),
	id: z.json(),
	fields: z.optional(z.record(z.string(), z.json())),
	// FIXME: Apparently Meteor can send `cleared` in `added`...
	cleared: z.optional(z.array(z.string())),
});

const AddedBeforeSchema = z.strictObject({
	msg: z.literal('addedBefore'),
	collection: z.string(),
	id: z.json(),
	fields: z.optional(z.record(z.string(), z.json())),
	before: z.optional(z.string()),
});

const ChangedSchema = z.strictObject({
	msg: z.literal('changed'),
	collection: z.string(),
	id: z.json(),
	fields: z.optional(z.record(z.string(), z.json())),
	cleared: z.optional(z.array(z.string())),
});

const MovedBeforeSchema = z.strictObject({
	msg: z.literal('movedBefore'),
	collection: z.string(),
	id: z.json(),
	before: z.optional(z.string()),
});

const RemovedSchema = z.strictObject({
	msg: z.literal('removed'),
	collection: z.string(),
	id: z.json(),
});
// Managing subscriptions
const NosubSchema = z.strictObject({
	msg: z.literal('nosub'),
	id: z.string(),
	error: z.optional(z.json()),
});
const ReadySchema = z.strictObject({
	msg: z.literal('ready'),
	subs: z.array(z.string()),
});
const SubSchema = z.strictObject({
	msg: z.literal('sub'),
	id: z.string(),
	name: z.string(),
	params: z.optional(z.array(z.json())),
});

const UnsubSchema = z.strictObject({
	msg: z.literal('unsub'),
	id: z.string(),
});

// Remote procedure calls
const MethodSchema = z.strictObject({
	msg: z.literal('method'),
	id: z.string(),
	method: z.string(),
	params: z.optional(z.array(z.json())),
	randomSeed: z.optional(z.string()),
});

const ResultSchema = z.strictObject({
	msg: z.literal('result'),
	id: z.string(),
	error: z.optional(z.json()),
	result: z.optional(z.json()),
});

const UpdatedSchema = z.strictObject({
	msg: z.literal('updated'),
	methods: z.array(z.string()),
});

/**
 * Main DDP Message Schema
 */
const DDPMessageSchema = z.discriminatedUnion('msg', [
	// Connection
	ConnectSchema,
	ConnectedSchema,
	FailedSchema,

	// Heartbeats
	PingSchema,
	PongSchema,

	// Data
	AddedSchema,
	AddedBeforeSchema,
	ChangedSchema,
	MovedBeforeSchema,
	RemovedSchema,

	// Subscriptions
	NosubSchema,
	ReadySchema,
	SubSchema,
	UnsubSchema,

	// RPC
	MethodSchema,
	ResultSchema,
	UpdatedSchema,
]);

/**
 * Inferred TypeScript Type
 * This is "erasable" as it compiles away completely.
 */
export type DDPMessage = z.infer<typeof DDPMessageSchema>;

/**
 * Parses a DDP message from JSON string
 * @param json The JSON string to parse
 * @returns The parsed DDP message
 * @throws If the JSON is invalid or does not conform to the DDP message schema
 */
export const parseDDPMessage = (json: string): DDPMessage => {
	return DDPMessageSchema.parse(JSON.parse(json));
};
