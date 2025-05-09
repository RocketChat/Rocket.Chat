import { type Device } from '@rocket.chat/ui-contexts';
import { createContext } from 'react';

import type VoIPClient from '../lib/VoipClient';

type VoipContextDisabled = {
	isEnabled: false;
	voipClient?: null;
	error?: null;
};

export type VoipContextError = {
	isEnabled: true;
	error: Error;
	voipClient: null;
	changeAudioOutputDevice: (selectedAudioDevices: Device) => Promise<void>;
	changeAudioInputDevice: (selectedAudioDevices: Device) => Promise<void>;
};

export type VoipContextEnabled = {
	isEnabled: true;
	voipClient: VoIPClient | null;
	error?: null;
	changeAudioOutputDevice: (selectedAudioDevices: Device) => Promise<void>;
	changeAudioInputDevice: (selectedAudioDevices: Device) => Promise<void>;
};

export type VoipContextReady = {
	isEnabled: true;
	voipClient: VoIPClient;
	error: null;
	changeAudioOutputDevice: (selectedAudioDevices: Device) => Promise<void>;
	changeAudioInputDevice: (selectedAudioDevices: Device) => Promise<void>;
};

export type VoipContextValue = VoipContextDisabled | VoipContextEnabled | VoipContextReady | VoipContextError;

export const isVoipContextReady = (context: VoipContextValue): context is VoipContextReady =>
	context.isEnabled && context.voipClient !== null;

export const VoipContext = createContext<VoipContextValue>({
	isEnabled: false,
	voipClient: null,
});
