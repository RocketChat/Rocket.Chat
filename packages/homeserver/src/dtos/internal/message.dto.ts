import { type Static, t } from 'elysia';
import { RoomIdDto, ServerNameDto, UsernameDto } from '../common/validation.dto';

export const InternalSendMessageBodyDto = t.Object({
	roomId: RoomIdDto,
	targetServer: ServerNameDto,
	message: t.String({ 
		minLength: 1,
		description: 'Message content'
	}),
	senderUserId: UsernameDto,
});

export const InternalUpdateMessageParamsDto = t.Object({
	messageId: t.String({ description: 'Message ID to update' }),
});

export const InternalUpdateMessageBodyDto = t.Object({
	roomId: RoomIdDto,
	targetServer: ServerNameDto,
	message: t.String({ 
		minLength: 1,
		description: 'Updated message content'
	}),
	senderUserId: UsernameDto,
});

export const InternalSendReactionParamsDto = t.Object({
	messageId: t.String({ description: 'Message ID to react to' }),
});

export const InternalSendReactionBodyDto = t.Object({
	roomId: RoomIdDto,
	targetServer: ServerNameDto,
	eventId: t.String({ description: 'Event ID to react to' }),
	emoji: t.String({ 
		minLength: 1,
		description: 'Emoji reaction'
	}),
	senderUserId: UsernameDto,
});

export const InternalMessageResponseDto = t.Object({
	event_id: t.String({ description: 'Created event ID' }),
	origin_server_ts: t.Number({ description: 'Server timestamp' }),
});

export const InternalReactionResponseDto = t.Object({
	event_id: t.String({ description: 'Created reaction event ID' }),
	origin_server_ts: t.Number({ description: 'Server timestamp' }),
}); 

export const InternalRedactMessageParamsDto = t.Object({
	messageId: t.String({ description: 'Message ID to redact' }),
});

export const InternalRedactMessageBodyDto = t.Object({
	roomId: RoomIdDto,
	targetServer: ServerNameDto,
	reason: t.Optional(t.String({ description: 'Reason for redacting' })),
	senderUserId: UsernameDto,
});

export const InternalRedactMessageResponseDto = InternalMessageResponseDto;


export type InternalMessageResponse = Static<typeof InternalMessageResponseDto>;
export type InternalReactionResponse = Static<typeof InternalReactionResponseDto>;
export type InternalSendMessageBody = Static<typeof InternalSendMessageBodyDto>;
export type InternalUpdateMessageBody = Static<typeof InternalUpdateMessageBodyDto>;
export type InternalUpdateMessageParams = Static<typeof InternalUpdateMessageParamsDto>;
export type InternalSendReactionBody = Static<typeof InternalSendReactionBodyDto>;
export type InternalSendReactionParams = Static<typeof InternalSendReactionParamsDto>;
export type InternalRedactMessageBody = Static<typeof InternalRedactMessageBodyDto>;
export type InternalRedactMessageParams = Static<typeof InternalRedactMessageParamsDto>;
export type InternalRedactMessageResponse = Static<typeof InternalRedactMessageResponseDto>;