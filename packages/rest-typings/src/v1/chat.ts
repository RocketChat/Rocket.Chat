import {
	IMessageSchema,
	IReadReceiptWithUserSchema,
	IRoomSchema,
	IUserSchema,
	IThreadMainMessageSchema,
	MessageUrlSchema,
} from '@rocket.chat/core-typings';
import * as z from 'zod';

import { SuccessResponseSchema } from './Ajv';
import { PaginatedRequestSchema } from '../helpers/PaginatedRequest';
import { PaginatedResultSchema } from '../helpers/PaginatedResult';

export const POSTChatDeleteBodySchema = z.object({
	msgId: IMessageSchema.shape._id,
	roomId: IRoomSchema.shape._id,
	asUser: z.boolean().optional(),
});

export const POSTChatDeleteResponseSchema = SuccessResponseSchema.extend({
	_id: IMessageSchema.shape._id,
	ts: z.string(),
	message: IMessageSchema.pick({ _id: true, rid: true, u: true }),
});

export const GETChatSyncMessagesQuerySchema = z.object({
	roomId: IRoomSchema.shape._id,
	lastUpdate: z.string().optional(),
	count: z
		.codec(z.string(), z.number().int().nonnegative(), {
			decode: (val) => parseInt(val, 10),
			encode: (val) => val.toString(),
		})
		.optional(),
	next: z.string().optional(),
	previous: z.string().optional(),
	type: z.enum(['UPDATED', 'DELETED']).optional(),
});

export const GETChatSyncMessagesResponseSchema = SuccessResponseSchema.extend({
	result: z.object({
		updated: z.array(IMessageSchema),
		deleted: z.array(IMessageSchema.pick({ _id: true }).and(z.object({ _deletedAt: z.iso.datetime() }))),
		cursor: z
			.object({
				next: z.string().nullable(),
				previous: z.string().nullable(),
			})
			.optional(),
	}),
});

export const GETChatGetMessageQuerySchema = z.object({ msgId: IMessageSchema.shape._id });

export const GETChatGetMessageResponseSchema = SuccessResponseSchema.extend({ message: IMessageSchema });

export const POSTChatPinMessageBodySchema = z.object({ messageId: IMessageSchema.shape._id });

export const POSTChatPinMessageResponseSchema = SuccessResponseSchema.extend({ message: IMessageSchema });

export const POSTChatUnPinMessageBodySchema = z.object({ messageId: IMessageSchema.shape._id });

export const POSTChatUpdateBodySchema = z
	.object({
		roomId: IRoomSchema.shape._id,
		msgId: IMessageSchema.shape._id,
	})
	.and(
		z.union([
			z.object({
				text: z.string(),
				previewUrls: z.array(z.string()).optional(),
				customFields: z.record(z.any(), z.any()).optional(),
			}),
			z.object({
				content: z.union([
					z.object({
						algorithm: z.literal('rc.v1.aes-sha2'),
						ciphertext: z.string(),
					}),
					z.object({
						algorithm: z.literal('rc.v2.aes-sha2'),
						ciphertext: z.string(),
						iv: z.string().meta({ description: 'Initialization Vector' }),
						kid: z.string().meta({ description: 'ID of the key used to encrypt the message' }),
					}),
					z.object({
						algorithm: z.literal('m.megolm.v1.aes-sha2'),
						ciphertext: z.string(),
					}),
				]),
				e2eMentions: z
					.object({
						e2eUserMentions: z.array(z.string()).optional(),
						e2eChannelMentions: z.array(z.string()).optional(),
					})
					.optional(),
			}),
		]),
	);

export const POSTChatUpdateResponseSchema = SuccessResponseSchema.extend({ message: IMessageSchema });

export const POSTChatPostMessageBodySchema = z
	.union([
		z.object({
			roomId: z.union([IRoomSchema.shape._id, z.array(IRoomSchema.shape._id)]),
		}),
		z.object({
			channel: z.union([IRoomSchema.shape._id, z.array(IRoomSchema.shape._id)]),
		}),
	])
	.and(
		z.object({
			text: z.string().optional(),
			msg: z.string().optional().meta({ description: 'overridden by text if present' }),
			username: z.string().optional(),
			alias: z.string().optional().meta({ description: 'overridden by username if present' }),
			icon_emoji: z.string().optional(),
			emoji: z.string().optional().meta({ description: 'overridden by icon_emoji if present' }),
			icon_url: z.string().optional(),
			avatar: z.string().optional().meta({ description: 'overridden by icon_url if present' }),
			attachments: z.array(z.record(z.any(), z.any())).optional(),
			parseUrls: z.boolean().optional(),
			bot: z.record(z.string(), z.any()).optional().meta({ deprecated: true }),
			groupable: z.boolean().optional(),
			tmid: z.string().optional(),
			customFields: z.record(z.string(), z.any()).optional(),
		}),
	);

export const POSTChatPostMessageResponseSchema = SuccessResponseSchema.extend({
	ts: z.number(),
	channel: IRoomSchema.shape._id,
	message: IMessageSchema,
});

export const GETChatSearchQuerySchema = z
	.object({
		roomId: IRoomSchema.shape._id,
		searchText: z.string(),
	})
	.and(PaginatedRequestSchema);

export const GETChatSearchResponseSchema = SuccessResponseSchema.extend({
	messages: z.array(
		IMessageSchema.omit({ u: true }).and(
			z.object({
				u: z.object({
					_id: IUserSchema.shape._id,
					username: z.string(),
					name: z.string().nullable().optional(),
				}),
			}),
		),
	),
});

export const POSTChatSendMessageBodySchema = z.object({
	message: IMessageSchema.omit({ attachments: true })
		.partial()
		.and(IMessageSchema.pick({ rid: true }))
		.and(
			z.object({
				text: z.string().optional().meta({ deprecated: true }),
				emoji: z.string().optional().meta({ deprecated: true }),
				attachments: z.array(z.record(z.any(), z.any())).optional(),
			}),
		),
	previewUrls: z.array(z.string()).optional(),
});

export const POSTChatSendMessageResponseSchema = SuccessResponseSchema.extend({ message: IMessageSchema });

export const POSTChatStarMessageBodySchema = z.object({
	messageId: IMessageSchema.shape._id,
});

export const POSTChatUnStarMessageBodySchema = z.object({
	messageId: IMessageSchema.shape._id,
});

export const POSTChatReactBodySchema = z.union([
	z.object({
		emoji: z.string(),
		messageId: IMessageSchema.shape._id,
		shouldReact: z.boolean().optional(),
	}),
	z.object({
		reaction: z.string(),
		messageId: IMessageSchema.shape._id,
		shouldReact: z.boolean().optional(),
	}),
]);

export const POSTChatReportMessageBodySchema = z.object({
	messageId: IMessageSchema.shape._id,
	description: z.string(),
});

export const GETChatIgnoreUserQuerySchema = z.object({
	rid: IRoomSchema.shape._id,
	userId: IUserSchema.shape._id,
	ignore: z
		.string()
		.optional()
		.meta({ description: "The param `ignore` cannot be boolean, since this is a GET method. Use strings 'true' or 'false' instead." }),
});

export const GETChatGetDeletedMessagesQuerySchema = z
	.object({
		roomId: IRoomSchema.shape._id,
		since: z.iso.datetime(),
	})
	.and(PaginatedRequestSchema);

export const GETChatGetDeletedMessagesResponseSchema = SuccessResponseSchema.extend({
	messages: z.array(IMessageSchema.pick({ _id: true })),
}).and(PaginatedResultSchema);

export const GETChatGetPinnedMessagesQuerySchema = z
	.object({
		roomId: IRoomSchema.shape._id,
	})
	.and(PaginatedRequestSchema);

export const GETChatGetPinnedMessagesResponseSchema = SuccessResponseSchema.extend({
	messages: z.array(IMessageSchema),
}).and(PaginatedResultSchema);

export const GETChatGetThreadsListQuerySchema = z
	.object({
		rid: IRoomSchema.shape._id,
		type: z.enum(['unread', 'following']).optional(),
		text: z.string().optional(),
		fields: z.string().optional(),
	})
	.and(PaginatedRequestSchema);

export const GETChatGetThreadsListResponseSchema = SuccessResponseSchema.extend({
	threads: z.array(IThreadMainMessageSchema),
}).and(PaginatedResultSchema);

export const GETChatSyncThreadsListQuerySchema = z.object({
	rid: IRoomSchema.shape._id,
	updatedSince: z.iso.datetime(),
});

export const GETChatSyncThreadsListResponseSchema = SuccessResponseSchema.extend({
	threads: z.object({
		update: z.array(IMessageSchema),
		remove: z.array(IMessageSchema),
	}),
});

export const GETChatGetThreadMessagesQuerySchema = z
	.object({
		tmid: z.string(),
	})
	.and(PaginatedRequestSchema);

export const GETChatGetThreadMessagesResponseSchema = SuccessResponseSchema.extend({
	messages: z.array(IMessageSchema),
}).and(PaginatedResultSchema);

export const GETChatSyncThreadMessagesQuerySchema = z
	.object({
		tmid: IMessageSchema.shape._id,
		updatedSince: z.iso.datetime(),
	})
	.and(PaginatedRequestSchema);

export const GETChatSyncThreadMessagesResponseSchema = SuccessResponseSchema.extend({
	messages: z.object({
		update: z.array(IMessageSchema),
		remove: z.array(IMessageSchema),
	}),
});

export const POSTChatFollowMessageBodySchema = z.object({
	mid: IMessageSchema.shape._id,
});

export const POSTChatUnfollowMessageBodySchema = z.object({
	mid: IMessageSchema.shape._id,
});

export const GETChatGetMentionedMessagesQuerySchema = z
	.object({
		roomId: IRoomSchema.shape._id,
	})
	.and(PaginatedRequestSchema);

export const GETChatGetMentionedMessagesResponseSchema = SuccessResponseSchema.extend({
	messages: z.array(IMessageSchema),
}).and(PaginatedResultSchema);

export const GETChatGetStarredMessagesQuerySchema = z
	.object({
		roomId: IRoomSchema.shape._id,
	})
	.and(PaginatedRequestSchema);

export const GETChatGetStarredMessagesResponseSchema = SuccessResponseSchema.extend({
	messages: z.array(IMessageSchema),
}).and(PaginatedResultSchema);

export const GETChatGetDiscussionsQuerySchema = z
	.object({
		roomId: IRoomSchema.shape._id,
		text: z.string().optional(),
	})
	.and(PaginatedRequestSchema);

export const GETChatGetDiscussionsResponseSchema = SuccessResponseSchema.extend({
	messages: z.array(IMessageSchema),
}).and(PaginatedResultSchema);

export const GETChatGetURLPreviewQuerySchema = z.object({
	roomId: IRoomSchema.shape._id,
	url: z.string(),
});

export const GETChatGetURLPreviewResponseSchema = SuccessResponseSchema.extend({
	urlPreview: MessageUrlSchema,
});

export const GETChatGetMessageReadReceiptsQuerySchema = z.object({
	messageId: IMessageSchema.shape._id,
});

export const GETChatGetMessageReadReceiptsResponseSchema = SuccessResponseSchema.extend({
	receipts: z.array(IReadReceiptWithUserSchema),
});

export type ChatEndpoints = {
	'/v1/chat.sendMessage': {
		POST: (params: z.infer<typeof POSTChatSendMessageBodySchema>) => z.infer<typeof POSTChatSendMessageResponseSchema>;
	};
	'/v1/chat.react': {
		POST: (params: z.infer<typeof POSTChatReactBodySchema>) => void;
	};
	'/v1/chat.update': {
		POST: (params: z.infer<typeof POSTChatUpdateBodySchema>) => z.infer<typeof POSTChatUpdateResponseSchema>;
	};
	'/v1/chat.syncMessages': {
		GET: (params: z.infer<typeof GETChatSyncMessagesQuerySchema>) => z.infer<typeof GETChatSyncMessagesResponseSchema>;
	};
};
