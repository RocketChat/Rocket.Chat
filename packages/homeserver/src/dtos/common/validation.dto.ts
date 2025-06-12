import { t } from 'elysia';

export const USERNAME_REGEX = /^@[A-Za-z0-9_=/.+-]+:(.+)$/;
export const ROOM_ID_REGEX = /^![A-Za-z0-9_=/.+-]+:(.+)$/;
export const EVENT_ID_REGEX = /^\$[A-Za-z0-9_=/.+-]+:(.+)$/;

export const UsernameDto = t.String({
	pattern: USERNAME_REGEX.source,
	description: 'Matrix user ID in format @user:server.com',
	examples: ['@alice:example.com'],
});

export const RoomIdDto = t.String({
	pattern: ROOM_ID_REGEX.source,
	description: 'Matrix room ID in format !room:server.com',
	examples: ['!room123:example.com'],
});

export const EventIdDto = t.String({
	pattern: EVENT_ID_REGEX.source,
	description: 'Matrix event ID in format $event:server.com',
	examples: ['$event123:example.com'],
});

export const ServerNameDto = t.String({
	description: 'Matrix server name',
	examples: ['example.com'],
});

export const TimestampDto = t.Number({
	description: 'Unix timestamp in milliseconds',
	minimum: 0,
});

export const DepthDto = t.Number({
	description: 'Event depth',
	minimum: 0,
}); 