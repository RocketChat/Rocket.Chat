import { createContext } from 'react';

const dummy = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQYV2Oora39DwAFaQJ3y3rKeAAAAABJRU5ErkJggg==';

/**
 * Type for room avatar path getter function with multiple signature variants
 * The provider implementation supports identifying rooms by roomId, roomName, or as params
 */
export type GetRoomPathAvatar = {
	(roomId: string, etag?: string): string;
	(params: { roomId?: string; roomName?: string; etag?: string; type?: string }): string;
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
