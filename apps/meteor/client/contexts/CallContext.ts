import type { IVoipRoom, ICallerInfo, VoIpCallerInfo } from '@rocket.chat/core-typings';
import type { Device } from '@rocket.chat/ui-contexts';
import { createContext, useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { useHasLicenseModule } from '../../ee/client/hooks/useHasLicenseModule';
import type { VoIPUser } from '../lib/voip/VoIPUser';

export type CallContextValue = CallContextDisabled | CallContextReady | CallContextError | CallContextEnabled;

export type CallContextDisabled = {
	enabled: false;
	ready: false;
	outBoundCallsAllowed: undefined;
	outBoundCallsEnabled: undefined;
	outBoundCallsEnabledForUser: undefined;
};

type CallContextEnabled = {
	enabled: true;
	ready: unknown;
	outBoundCallsAllowed: undefined;
	outBoundCallsEnabled: undefined;
	outBoundCallsEnabledForUser: undefined;
};

type CallContextReady = {
	outBoundCallsEnabled: boolean;
	outBoundCallsAllowed: boolean;
	outBoundCallsEnabledForUser: boolean;
	enabled: true;
	ready: true;
	voipClient: VoIPUser;
	actions: CallActionsType;
	queueName: string;
	queueCounter: number;
	networkStatus: 'online' | 'offline';
	openedRoomInfo: { v: { token?: string }; rid: string };
	openWrapUpModal: () => void;
	openRoom: (rid: IVoipRoom['_id']) => void;
	createRoom: (caller: ICallerInfo) => Promise<IVoipRoom['_id']>;
	closeRoom: (data?: { comment?: string; tags?: string[] }) => void;
	changeAudioOutputDevice: (selectedAudioDevices: Device) => void;
	changeAudioInputDevice: (selectedAudioDevices: Device) => void;
	register: () => void;
	unregister: () => void;
};
export type CallContextError = {
	enabled: true;
	ready: false;
	outBoundCallsAllowed: undefined;
	outBoundCallsEnabled: undefined;
	outBoundCallsEnabledForUser: undefined;
	error: Error | unknown;
};

export const isCallContextReady = (context: CallContextValue): context is CallContextReady => (context as CallContextReady).ready;

export const isCallContextError = (context: CallContextValue): context is CallContextError =>
	(context as CallContextError).error !== undefined;

export type CallActionsType = {
	mute: () => unknown;
	unmute: () => unknown;
	pause: () => unknown;
	resume: () => unknown;
	end: () => unknown;
	pickUp: () => unknown;
	reject: () => unknown;
};

const CallContextValueDefault: CallContextValue = {
	enabled: false,
	ready: false,
	outBoundCallsAllowed: undefined,
	outBoundCallsEnabled: undefined,
	outBoundCallsEnabledForUser: undefined,
};

export const CallContext = createContext<CallContextValue>(CallContextValueDefault);

export const useIsVoipEnterprise = (): boolean => useHasLicenseModule('voip-enterprise') === true;

export const useIsCallEnabled = (): boolean => {
	const { enabled } = useContext(CallContext);
	return enabled;
};

export const useIsCallReady = (): boolean => {
	const { ready } = useContext(CallContext);

	return Boolean(ready);
};
export const useIsCallError = (): boolean => {
	const context = useContext(CallContext);
	return Boolean(isCallContextError(context));
};

export const useCallContext = (): CallContextValue => {
	const context = useContext(CallContext);
	if (!isCallContextReady(context)) {
		throw new Error('useCallContext only if Calls are enabled and ready');
	}
	return context;
};

export const useCallActions = (): CallActionsType => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useCallActions only if Calls are enabled and ready');
	}
	return context.actions;
};

export const useCallerInfo = (): VoIpCallerInfo => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useCallerInfo only if Calls are enabled and ready');
	}

	const { voipClient } = context;

	const [subscribe, getSnapshot] = useMemo(() => {
		let caller: VoIpCallerInfo = voipClient.callerInfo;

		const callback = (cb: () => void): (() => void) =>
			voipClient.on('stateChanged', () => {
				caller = voipClient.callerInfo;
				cb();
			});

		const getSnapshot = (): VoIpCallerInfo => caller;
		return [callback, getSnapshot];
	}, [voipClient]);

	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useCallCreateRoom = (): CallContextReady['createRoom'] => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useCallCreateRoom only if Calls are enabled and ready');
	}

	return context.createRoom;
};

export const useCallOpenRoom = (): CallContextReady['openRoom'] => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useCallOpenRoom only if Calls are enabled and ready');
	}

	return context.openRoom;
};

export const useCallCloseRoom = (): CallContextReady['closeRoom'] => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useCallCloseRoom only if Calls are enabled and ready');
	}

	return context.closeRoom;
};

export const useCallClient = (): VoIPUser => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useCallClient only if Calls are enabled and ready');
	}

	return context.voipClient;
};

export const useQueueName = (): CallContextReady['queueName'] => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useQueueName only if Calls are enabled and ready');
	}

	return context.queueName;
};

export const useQueueCounter = (): CallContextReady['queueCounter'] => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useQueueCounter only if Calls are enabled and ready');
	}

	return context.queueCounter;
};

export const useWrapUpModal = (): CallContextReady['openWrapUpModal'] => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useWrapUpModal only if Calls are enabled and ready');
	}

	return context.openWrapUpModal;
};

export const useOpenedRoomInfo = (): CallContextReady['openedRoomInfo'] => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useOpenedRoomInfo only if Calls are enabled and ready');
	}

	return context.openedRoomInfo;
};

export const useChangeAudioOutputDevice = (): CallContextReady['changeAudioOutputDevice'] => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useChangeAudioOutputDevice only if Calls are enabled and ready');
	}

	return context.changeAudioOutputDevice;
};

export const useChangeAudioInputDevice = (): CallContextReady['changeAudioOutputDevice'] => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useChangeAudioInputDevice only if Calls are enabled and ready');
	}

	return context.changeAudioInputDevice;
};

export const useCallRegisterClient = (): (() => void) => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useCallRegisterClient only if Calls are enabled and ready');
	}

	return context.register;
};

export const useCallUnregisterClient = (): (() => void) => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useCallUnregisterClient only if Calls are enabled and ready');
	}

	return context.unregister;
};

export const useVoipOutboundStates = (): {
	outBoundCallsAllowed: boolean;
	outBoundCallsEnabled: boolean;
	outBoundCallsEnabledForUser: boolean;
} => {
	const isEnterprise = useIsVoipEnterprise();
	const callerInfo = useCallerInfo();

	return {
		outBoundCallsAllowed: isEnterprise,
		outBoundCallsEnabled: isEnterprise,
		outBoundCallsEnabledForUser: isEnterprise && !['IN_CALL', 'ON_HOLD', 'UNREGISTERED', 'INITIAL'].includes(callerInfo.state),
	};
};

export const useVoipNetworkStatus = (): 'online' | 'offline' => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useVoipNetworkStatus only if Calls are enabled and ready');
	}

	return context.networkStatus;
};
