import type { ICustomSound } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type CustomSoundContextValue = {
	play: (
		soundId: string,
		options?:
			| {
					volume?: number | undefined;
					loop?: boolean | undefined;
			  }
			| undefined,
	) => void;
	pause: (sound: ICustomSound['_id']) => void;
	stop: (sound: ICustomSound['_id']) => void;
	callSounds: {
		playRinger: () => void;
		playDialer: () => void;
		stopRinger: () => void;
		stopDialer: () => void;
	};
	voipSounds: {
		playRinger: () => void;
		playDialer: () => void;
		playCallEnded: () => void;
		stopRinger: () => void;
		stopDialer: () => void;
		stopCallEnded: () => void;
		stopAll: () => void;
	};
	notificationSounds: {
		playNewRoom: () => void;
		playNewMessage: () => void;
		playNewMessageLoop: () => void;
		stopNewRoom: () => void;
		stopNewMessage: () => void;
	};
	list: ICustomSound[];
};

export const CustomSoundContext = createContext<CustomSoundContextValue>({
	play: () => new Promise(() => undefined),
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
		playNewMessage: () => undefined,
		playNewMessageLoop: () => undefined,
		stopNewRoom: () => undefined,
		stopNewMessage: () => undefined,
	},
	list: [],
});
