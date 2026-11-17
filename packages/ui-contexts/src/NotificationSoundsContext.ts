import type { ICustomSound } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type NotificationSoundsContextValue = {
	playNewRoom: () => void;
	playNewRoomLoop: () => void;
	playNewMessage: () => void;
	stopNewRoom: () => void;
	stopNewMessage: () => void;
	playNewMessageCustom: (soundId: ICustomSound['_id']) => void;
};

export const NotificationSoundsContext = createContext<NotificationSoundsContextValue>({
	playNewRoom: () => undefined,
	playNewRoomLoop: () => undefined,
	playNewMessage: () => undefined,
	stopNewRoom: () => undefined,
	stopNewMessage: () => undefined,
	playNewMessageCustom: () => undefined,
});
