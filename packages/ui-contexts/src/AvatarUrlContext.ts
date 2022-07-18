import { createContext } from 'react';

const dummy = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQYV2Oora39DwAFaQJ3y3rKeAAAAABJRU5ErkJggg==';

export type AvatarUrlContextValue = {
	getUserAvatarURL: (username: string) => string;
	subscribeToUserAvatarURL: (username: string, callback: () => void) => () => void;
	getRoomPathAvatar: (...args: any) => string;
};

export const AvatarUrlContext = createContext<AvatarUrlContextValue>({
	getUserAvatarURL: () => dummy,
	subscribeToUserAvatarURL: () => (): void => undefined,
	getRoomPathAvatar: () => dummy,
});
