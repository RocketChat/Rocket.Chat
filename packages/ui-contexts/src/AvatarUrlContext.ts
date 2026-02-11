import { createContext } from 'react';

const dummy = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQYV2Oora39DwAFaQJ3y3rKeAAAAABJRU5ErkJggg==';

/**
 * Type for room avatar path getter function
 * Supports legacy overloads and the room object form used by providers.
 */
export type GetRoomPathAvatar = {
	(roomId: string, etag?: string): string;
	(params: { roomId?: string; roomName?: string; etag?: string; type?: string; [key: string]: unknown }): string;
	(room: {
		_id: string;
		type?: string;
		t?: string;
		avatarETag?: string;
		cache?: string;
		[key: string]: unknown;
	}): string;
};

export type AvatarUrlContextValue = {
	getUserPathAvatar: {
		(username: string, etag?: string): string;
		(params: { userId: string; etag?: string }): string;
		(params: { username: string; etag?: string }): string;
	};
	getRoomPathAvatar: GetRoomPathAvatar;
};

export const AvatarUrlContext = createContext<AvatarUrlContextValue>({
	getUserPathAvatar: () => dummy,
	getRoomPathAvatar: () => dummy,
});
