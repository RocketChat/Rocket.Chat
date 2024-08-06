import { type Device } from '@rocket.chat/ui-contexts';
import { createContext } from 'react';

import type VoIPClient from '../lib/voip-team-collab/VoIPClient';

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

export type VoiceCallOngoingSession = {
	type: 'ONGOING';
	contact: ContactInfo;
	muted: boolean;
	held: boolean;
	end(): void;
	mute(muted?: boolean): void;
	hold(held?: boolean): void;
	dtmf(digit: string): void;
};

export type VoiceCallIncomingSession = VoiceCallGenericSession & {
	type: 'INCOMING';
	contact: ContactInfo;
	muted: boolean;
	end(): void;
	accept(): Promise<void>;
	mute(muted?: boolean): void;
	// tranferOrigin?: string;
};

export type VoiceCallOutgoingSession = VoiceCallGenericSession & {
	type: 'OUTGOING';
	contact: ContactInfo;
	muted: boolean;
	end(): void;
	mute(mute?: boolean): void;
};

export type VoiceCallErrorSession = VoiceCallGenericSession & {
	type: 'ERROR';
	contact: ContactInfo;
	error: { status?: number; reason: string };
	end(): void;
};

export type VoiceCallGenericSession = {
	type: 'INCOMING' | 'OUTGOING' | 'ONGOING' | 'ERROR';
	contact: ContactInfo | null;
	muted?: boolean;
	held?: boolean;
	error?: { status?: number; reason: string };
	accept?(): Promise<void>;
	end?(): void;
	mute?(mute?: boolean): void;
	hold?(held?: boolean): void;
	dtmf?(digit: string): void;
};

export type VoiceCallSession = VoiceCallIncomingSession | VoiceCallOngoingSession | VoiceCallOutgoingSession | VoiceCallErrorSession;

export type VoiceCallEvents = {
	// TODO: Move to core-typings
	registered: undefined;
	registrationerror: unknown;
	unregistered: undefined;
	unregistrationerror: unknown;
	connected: undefined;
	connectionerror: unknown;
	callestablished: ContactInfo;
	incomingcall: ContactInfo;
	callfailed: string;
	outgoingcall: ContactInfo;
	callterminated: undefined;
	hold: undefined;
	holderror: undefined;
	muteerror: undefined;
	unhold: undefined;
	unholderror: undefined;
	stateChanged: undefined;
	dialer: { open: boolean };
};

export type ContactInfo = {
	id: string;
	name: string;
	host: string;
};

export const isVoiceCallContextReady = (context: VoiceCallContextValue): context is VoiceCallContextReady =>
	context.isEnabled && context.voipClient !== null;

export const isVoiceCallIncomingSession = (session: VoiceCallSession | null): session is VoiceCallIncomingSession => {
	return session?.type === 'INCOMING';
};

export const VoiceCallContext = createContext<VoiceCallContextValue>({
	isEnabled: false,
	voipClient: null,
});

export default VoiceCallContext;
