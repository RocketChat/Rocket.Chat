import * as z from 'zod';

import { IRocketChatRecordSchema } from '../IRocketChatRecord';
import { IUserSchema } from '../IUser';
import { serializableDate, type RequiredField } from '../utils';

const MediaCallActorTypeSchema = z.enum(['user', 'sip']);

const MediaCallActorSchema = z.object({
	type: MediaCallActorTypeSchema,
	id: z.string(),
	contractId: z.string().optional(),
});

const MediaCallSignedEntitySchema = MediaCallActorSchema.extend({
	contractId: z.string(),
});

const ServerActorSchema = z.object({
	type: z.literal('server'),
	id: z.literal('server'),
});

const MediaCallContactInformationSchema = z.object({
	displayName: z.string().optional(),
	username: z.string().optional(),
	sipExtension: z.string().optional(),
});

const MediaCallContactSchema = MediaCallActorSchema.extend(MediaCallContactInformationSchema.shape);

const MediaCallSignedContactSchema = MediaCallContactSchema.extend(MediaCallSignedEntitySchema.shape);

const MediaCallStateSchema = z.enum(['none', 'ringing', 'accepted', 'active', 'hangup']).meta({
	description:
		'The list of call states that may actually be stored on the collection is smaller than the list of call states that may be computed by the client class',
});

export const IMediaCallsSchema = IRocketChatRecordSchema.extend({
	service: z.literal('webrtc'),
	kind: z.literal('direct'),

	state: MediaCallStateSchema,

	createdBy: MediaCallContactSchema,
	createdAt: serializableDate,

	caller: MediaCallSignedContactSchema,
	callee: MediaCallContactSchema,

	ended: z.boolean(),
	endedBy: z.union([MediaCallActorSchema, ServerActorSchema]).optional(),
	endedAt: serializableDate.optional(),
	hangupReason: z.string().optional(),

	expiresAt: serializableDate,

	acceptedAt: serializableDate.optional().meta({ description: 'The timestamp of the moment the callee accepted the call' }),
	activatedAt: serializableDate
		.optional()
		.meta({ description: 'The timestamp of the moment either side reported the call as active for the first time' }),

	callerRequestedId: z.string().optional(),
	parentCallId: z.string().optional(),

	transferredBy: MediaCallSignedContactSchema.optional().meta({
		description: 'The contact who initiated the transfer',
	}),
	transferredTo: MediaCallContactSchema.optional().meta({
		description: 'The contact to whom the call was transferred',
	}),
	transferredAt: serializableDate.optional().meta({ description: 'The timestamp of the moment the transfer was requested' }),

	uids: z.array(IUserSchema.shape._id).meta({ description: 'List of user IDs involved in the call' }),
});

export type MediaCallActorType = z.infer<typeof MediaCallActorTypeSchema>;

export type MediaCallActor<T extends MediaCallActorType = MediaCallActorType> = z.infer<typeof MediaCallActorSchema> & {
	type: T;
};

export type MediaCallSignedEntity<T extends MediaCallActor> = RequiredField<T, 'contractId'>;

export type MediaCallSignedActor<T extends MediaCallActorType = MediaCallActorType> = MediaCallSignedEntity<MediaCallActor<T>>;

export type ServerActor = z.infer<typeof ServerActorSchema>;

export type MediaCallContactInformation = z.infer<typeof MediaCallContactInformationSchema>;

export type MediaCallContact<T extends MediaCallActorType = MediaCallActorType> = MediaCallActor<T> & MediaCallContactInformation;

export type MediaCallSignedContact<T extends MediaCallActorType = MediaCallActorType> = MediaCallSignedEntity<MediaCallContact<T>>;

export type MediaCallState = z.infer<typeof MediaCallStateSchema>;

export interface IMediaCall extends z.infer<typeof IMediaCallsSchema> {}
