import { createContext, useContext } from 'react';

const dummy = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=';

type AvatarContextValue = {
	getUserPathAvatar: (uid: string, etag?: string) => string;
	getRoomPathAvatar: (...args: any) => string;
}
const AvatarUrlContextValueDefault: AvatarContextValue = {
	getUserPathAvatar: () => dummy,
	getRoomPathAvatar: () => dummy,
};

export const AvatarUrlContext = createContext<AvatarContextValue>(AvatarUrlContextValueDefault);

export const useRoomAvatarPath = (): (uid: string, etag?: string) => string => useContext(AvatarUrlContext).getRoomPathAvatar;

export const useUserAvatarPath = (): (...args: any) => string => useContext(AvatarUrlContext).getUserPathAvatar;
