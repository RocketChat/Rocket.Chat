import { createContext, useContext } from 'react';

/** Workspace features a room's header, toolbox and composer are shown with */
export type RoomFeatures = {
	e2eEnabled: boolean;
	unencryptedMessagesAllowed: boolean;
	favoritesEnabled: boolean;
	autoTranslateEnabled: boolean;
};

export const defaultRoomFeatures: RoomFeatures = {
	e2eEnabled: false,
	unencryptedMessagesAllowed: false,
	favoritesEnabled: true,
	autoTranslateEnabled: false,
};

export const RoomFeaturesContext = createContext<RoomFeatures>(defaultRoomFeatures);

export const useRoomFeatures = (): RoomFeatures => useContext(RoomFeaturesContext);
