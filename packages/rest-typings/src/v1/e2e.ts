import { serializableDate } from '@rocket.chat/core-typings';
import * as z from 'zod';

import { SuccessResponseSchema } from './Ajv';

export const POSTE2ESetRoomKeyIDBodySchema = z.object({
	rid: z.string(),
	keyID: z.string(),
});

export const POSTE2ESetRoomKeyIDResponseSchema = SuccessResponseSchema;

export const GETE2EFetchMyKeysResponseSchema = SuccessResponseSchema.and(
	z.union([
		z.object({
			public_key: z.string(),
			private_key: z.string(),
		}),
		z.record(z.any(), z.any()),
	]),
);

export const GETE2EGetUsersOfRoomWithoutKeyQuerySchema = z.object({
	rid: z.string(),
});

export const GETE2EGetUsersOfRoomWithoutKeyResponseSchema = SuccessResponseSchema.extend({
	users: z.array(
		z.object({
			_id: z.string(),
			e2e: z
				.object({
					private_key: z.string(),
					public_key: z.string(),
				})
				.optional(),
		}),
	),
});

export const POSTE2ESetUserPublicAndPrivateKeysBodySchema = z.object({
	public_key: z.string(),
	private_key: z.string(),
	force: z.boolean().optional(),
});

export const POSTE2EUpdateGroupKeyBodySchema = z.object({
	uid: z.string(),
	rid: z.string(),
	key: z.string(),
});

export const POSTE2EAcceptSuggestedGroupKeyBodySchema = z.object({
	rid: z.string(),
});

export const POSTE2ERejectSuggestedGroupKeyBodySchema = z.object({
	rid: z.string(),
});

export const GETE2EFetchUsersWaitingForGroupKeyQuerySchema = z.object({
	roomIds: z.array(z.string()),
});

export const GETE2EFetchUsersWaitingForGroupKeyResponseSchema = SuccessResponseSchema.extend({
	usersWaitingForE2EKeys: z.record(
		z.string(),
		z.array(
			z.object({
				_id: z.string(),
				public_key: z.string(),
			}),
		),
	),
});

export const POSTE2EProvideUsersSuggestedGroupKeysBodySchema = z.object({
	usersSuggestedGroupKeys: z.record(
		z.string(),
		z.array(
			z.object({
				_id: z.string(),
				key: z.string(),
				oldKeys: z
					.array(
						z.object({
							e2eKeyId: z.string(),
							ts: serializableDate,
							E2EKey: z.string(),
						}),
					)
					.optional(),
			}),
		),
	),
});

export const POSTE2EResetRoomKeyBodySchema = z.object({
	rid: z.string(),
	e2eKey: z.string(),
	e2eKeyId: z.string(),
});
