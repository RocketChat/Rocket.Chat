import { useSetting } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { fireGlobalEventBase } from '../lib/utils/fireGlobalEventBase';

const getScopeForEvent = (eventName: string, scope?: string) => (scope ? `${eventName}/${scope}` : eventName);

export const useFireGlobalEvent = (eventName: string, scope?: string) => {
	const sendEnabled = useSetting('Iframe_Integration_send_enable');
	const origin = useSetting('Iframe_Integration_send_target_origin');

	const dispatchedRef = useRef({ scope: getScopeForEvent(eventName, scope), dispatched: false });

	useEffect(() => {
		const newScope = getScopeForEvent(eventName, scope);
		if (dispatchedRef.current?.scope !== newScope) {
			dispatchedRef.current = { scope: newScope, dispatched: false };
		}
	}, [scope, eventName]);

	return useMutation({
		mutationFn: async (data?: unknown) => {
			if (scope && dispatchedRef.current.dispatched) {
				return;
			}

			const postMessage = fireGlobalEventBase(eventName, data);
			postMessage(sendEnabled as boolean, origin as string);
			dispatchedRef.current.dispatched = true;
		},
		scope: scope ? { id: getScopeForEvent(eventName, scope) } : undefined,
	});
};
