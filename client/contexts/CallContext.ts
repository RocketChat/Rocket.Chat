import { createContext, useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';
import { VoIpCallerInfo } from '../components/voip/definitions/VoIpCallerInfo';

import { IRegistrationInfo } from '../components/voip/IRegistrationInfo';
import { VoIPUser } from '../components/voip/VoIPUser';

type CallContextValue = CallContextDisabled | CallContextEnabled | CallContextReady;

type CallContextDisabled = {
	enabled: false;
	ready: false;
};

type CallContextEnabled = {
	enabled: true;
	ready: false;
};
type CallContextReady = {
	enabled: true;
	ready: true;
	registrationInfo: IRegistrationInfo; // TODO: Remove after delete the example
	voipClient: VoIPUser;
	actions: CallActions;
};

export const isCallContextReady = (context: CallContextValue): context is CallContextReady =>
	(context as CallContextReady).ready;

type CallActions = {
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

/* @deprecated */
export const useCallRegistrationInfo = (): IRegistrationInfo => {
	const context = useContext(CallContext);

	if (!context.enabled || !context.ready) {
		throw new Error('useCallRegistrationInfo only if Calls are enabled and ready');
	}
	return context.registrationInfo;
};

export const useCallActions = (): CallActions => {
	const context = useContext(CallContext);

	if (!context.enabled || !context.ready) {
		throw new Error('useCallActions only if Calls are enabled and ready');
	}
	return context.actions;
};

export const useCallState = (): VoIpCallerInfo => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useCallState only if Calls are enabled and ready');
	}
	const { voipClient } = context;
	const subscription = useMemo(
		() => ({
			getCurrentValue: (): VoIpCallerInfo => voipClient.callerInfo,
			subscribe: (callback: () => void): (() => void) => {
				voipClient.on('stateChanged', callback);

				return (): void => {
					voipClient.off('stateChanged', callback);
				};
			},
		}),
		[voipClient],
	);
	return useSubscription(subscription);
};

export const useCallClient = (): VoIPUser => {
	const context = useContext(CallContext);

	if (!isCallContextReady(context)) {
		throw new Error('useClient only if Calls are enabled and ready');
	}
	return context.voipClient;
};