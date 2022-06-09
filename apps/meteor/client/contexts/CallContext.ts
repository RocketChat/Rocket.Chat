import type { CallStates, IVoipRoom } from '@rocket.chat/core-typings';
import { ICallerInfo, VoIpCallerInfo } from '@rocket.chat/core-typings';
import { createContext, useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { VoIPUser } from '../lib/voip/VoIPUser';

export type CallContextValue = CallContextDisabled | CallContextEnabled | CallContextReady | CallContextError;

type CallContextDisabled = {
	enabled: false;
	ready: false;
};

type CallContextEnabled = {
	enabled: true;
	ready: unknown;
};

type CallContextReady = {
	enabled: true;
	ready: true;
	voipClient: VoIPUser;
	actions: CallActionsType;
	queueName: string;
	queueCounter: number;
	openedRoomInfo: { v: { token?: string }; rid: string };
	openWrapUpModal: () => void;
	openRoom: (rid: IVoipRoom['_id']) => void;
	createRoom: (caller: ICallerInfo) => IVoipRoom['_id'];
	closeRoom: (data?: { comment?: string; tags?: string[] }) => void;
};

type CallContextError = {
	enabled: true;
	ready: false;
	error: Error;
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
};

export const CallContext = createContext<CallContextValue>(CallContextValueDefault);

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

const useCallContext = (): CallContextReady => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useCallContext only if Calls are enabled and ready');
	}

	return context;
};

export const useCallActions = (): CallActionsType => {
	const context = useCallContext();

	return context.actions;
};

export const useCallerInfo = (): VoIpCallerInfo => {
	const context = useCallContext();

	const { voipClient } = context;

	const subscription = useMemo(
		() => ({
			getCurrentValue: (): VoIpCallerInfo => voipClient.callerInfo,
			subscribe: (callback: () => void): (() => void) => {
				voipClient.on('stateChanged', callback);
				return (): void => voipClient.off('stateChanged', callback);
			},
		}),
		[voipClient],
	);

	return useSubscription(subscription);
};

export const useCallerState = (): CallStates | null => {
	const context = useContext(CallContext);

	const subscription = useMemo(
		() => ({
			getCurrentValue: (): CallStates | null => (isCallContextReady(context) ? context.voipClient.callerInfo.state : null),
			subscribe: (callback: () => void): (() => void) => {
				if (!isCallContextReady(context)) {
					return (): void => undefined;
				}

				context.voipClient.on('stateChanged', callback);
				return (): void => context.voipClient.off('stateChanged', callback);
			},
		}),
		[context],
	);

	return useSubscription(subscription);
};

export const useCallCreateRoom = (): CallContextReady['createRoom'] => {
	const context = useCallContext();

	return context.createRoom;
};

export const useCallOpenRoom = (): CallContextReady['openRoom'] => {
	const context = useCallContext();

	return context.openRoom;
};

export const useCallCloseRoom = (): CallContextReady['closeRoom'] => {
	const context = useCallContext();

	return context.closeRoom;
};

export const useCallClient = (): VoIPUser => {
	const context = useCallContext();

	return context.voipClient;
};

export const useQueueName = (): CallContextReady['queueName'] => {
	const context = useCallContext();

	return context.queueName;
};

export const useQueueCounter = (): CallContextReady['queueCounter'] => {
	const context = useCallContext();

	return context.queueCounter;
};

export const useWrapUpModal = (): CallContextReady['openWrapUpModal'] => {
	const context = useCallContext();

	return context.openWrapUpModal;
};

export const useOpenedRoomInfo = (): CallContextReady['openedRoomInfo'] => {
	const context = useCallContext();

	return context.openedRoomInfo;
};
