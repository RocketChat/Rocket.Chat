import { createContext, useContext } from 'react';

const dummy = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQYV2Oora39DwAFaQJ3y3rKeAAAAABJRU5ErkJggg==';

type AvatarContextValue = {
	getUserPathAvatar: (uid: string, etag?: string) => string;
	getRoomPathAvatar: (...args: any) => string;
};
const AvatarUrlContextValueDefault: AvatarContextValue = {
	getUserPathAvatar: () => dummy,
	getRoomPathAvatar: () => dummy,
};

export const AvatarUrlContext = createContext<AvatarContextValue>(AvatarUrlContextValueDefault);

export const useRoomAvatarPath = (): ((uid: string, etag?: string) => string) => useContext(AvatarUrlContext).getRoomPathAvatar;

export const useUserAvatarPath = (): ((...args: any) => string) => useContext(AvatarUrlContext).getUserPathAvatar;
