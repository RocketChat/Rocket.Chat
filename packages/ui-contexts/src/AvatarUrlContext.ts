import { createContext } from 'react';

const dummy = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQYV2Oora39DwAFaQJ3y3rKeAAAAABJRU5ErkJggg==';

export type AvatarUrlContextValue = {
	getUserPathAvatar: {
		(username: string, etag?: string): string;
		(params: { userId: string; etag?: string }): string;
		(params: { username: string; etag?: string }): string;
	};
	getRoomPathAvatar: (...args: any) => string;
};

export const AvatarUrlContext = createContext<AvatarUrlContextValue>({
	getUserPathAvatar: () => dummy,
	getRoomPathAvatar: () => dummy,
});
