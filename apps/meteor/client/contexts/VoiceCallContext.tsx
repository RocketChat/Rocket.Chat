import { type Device } from '@rocket.chat/ui-contexts';
import { createContext } from 'react';

import type VoIPClient from '../lib/voip/VoIPClient';

type VoiceCallContextDisabled = {
	isEnabled: false;
	voipClient?: null;
	error?: null;
};

export type VoiceCallContextError = {
	isEnabled: true;
	error: Error;
	voipClient: null;
	changeAudioOutputDevice: (selectedAudioDevices: Device) => Promise<void>;
	changeAudioInputDevice: (selectedAudioDevices: Device) => Promise<void>;
};

export type VoiceCallContextEnabled = {
	isEnabled: true;
	voipClient: VoIPClient | null;
	error?: null;
	changeAudioOutputDevice: (selectedAudioDevices: Device) => Promise<void>;
	changeAudioInputDevice: (selectedAudioDevices: Device) => Promise<void>;
};

export type VoiceCallContextReady = {
	isEnabled: true;
	voipClient: VoIPClient;
	error: null;
	changeAudioOutputDevice: (selectedAudioDevices: Device) => Promise<void>;
	changeAudioInputDevice: (selectedAudioDevices: Device) => Promise<void>;
};

export type VoiceCallContextValue = VoiceCallContextDisabled | VoiceCallContextEnabled | VoiceCallContextReady | VoiceCallContextError;

export const isVoiceCallContextReady = (context: VoiceCallContextValue): context is VoiceCallContextReady =>
	context.isEnabled && context.voipClient !== null;

export const VoiceCallContext = createContext<VoiceCallContextValue>({
	isEnabled: false,
	voipClient: null,
});

export default VoiceCallContext;
