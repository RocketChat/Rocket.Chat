import { createContext, useContext } from 'react';

const dummy = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=';

type AvatarContextValue = {
	getUserPathAvatar: (uid: string, etag?: string) => string;
	getRoomPathAvatar: (...args: any) => string;
}
const AvatarContextValueDefault: AvatarContextValue = {
	getUserPathAvatar: () => dummy,
	getRoomPathAvatar: () => dummy,
};

export const AvatarContext = createContext<AvatarContextValue>(AvatarContextValueDefault);

export const useRoomAvatarPath = () => useContext(AvatarContext).getRoomPathAvatar;

export const useUserAvatarPath = () => useContext(AvatarContext).getUserPathAvatar;
