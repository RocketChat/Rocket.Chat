import type { ICustomSound } from '@rocket.chat/core-typings';
import { createContext } from 'react';

/** Stops the sound it was returned for; absent when there was nothing to play. */
type StopSound = (() => void) | undefined;

export type CustomSoundContextValue = {
	play: (
		soundId: string,
		options?: {
			volume?: number | undefined;
			loop?: boolean | undefined;
		},
	) => StopSound;
	pause: (sound: ICustomSound['_id']) => void;
	stop: (sound: ICustomSound['_id']) => void;
	callSounds: {
		playRinger: () => StopSound;
		playDialer: () => StopSound;
		stopRinger: () => void;
		stopDialer: () => void;
	};
	voipSounds: {
		playRinger: () => StopSound;
		playDialer: () => StopSound;
		playCallEnded: () => StopSound;
		stopRinger: () => void;
		stopDialer: () => void;
		stopCallEnded: () => void;
		stopAll: () => void;
	};
	notificationSounds: {
		playNewRoom: () => void;
		playNewRoomLoop: () => void;
		playNewMessage: () => void;
		stopNewRoom: () => void;
		stopNewMessage: () => void;
		playNewMessageCustom: (soundId: ICustomSound['_id']) => void;
	};
	list: Omit<ICustomSound, '_updatedAt'>[];
};

export const CustomSoundContext = createContext<CustomSoundContextValue>({
	play: () => undefined,
	pause: () => undefined,
	stop: () => undefined,
	callSounds: {
		playRinger: () => undefined,
		playDialer: () => undefined,
		stopRinger: () => undefined,
		stopDialer: () => undefined,
	},
	voipSounds: {
		playRinger: () => undefined,
		playDialer: () => undefined,
		playCallEnded: () => undefined,
		stopRinger: () => undefined,
		stopDialer: () => undefined,
		stopCallEnded: () => undefined,
		stopAll: () => undefined,
	},
	notificationSounds: {
		playNewRoom: () => undefined,
		playNewRoomLoop: () => undefined,
		playNewMessage: () => undefined,
		stopNewRoom: () => undefined,
		stopNewMessage: () => undefined,
		playNewMessageCustom: () => undefined,
	},
	list: [],
});
