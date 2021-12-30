import React, { ContextType, ReactElement, ReactNode, useEffect, useMemo } from 'react';

import { e2ee } from '../../../../app/e2e/client';
import { onClientBeforeSendMessage } from '../../../lib/onClientBeforeSendMessage';
import { onClientMessageReceived } from '../../../lib/onClientMessageReceived';
import { E2EEContext } from '../E2EEContext';
import { useFlags } from './useFlags';
import { useUserKeys } from './useUserKeys';

type E2EEProviderProps = {
	children: ReactNode;
};

const E2EEProvider = ({ children }: E2EEProviderProps): ReactElement => {
	const { supported, activable, enabled } = useFlags();

	const active = supported && activable && enabled;

	const { data: keyPair } = useUserKeys({ enabled: active });

	useEffect(() => {
		if (!keyPair) {
			return;
		}

		e2ee.use(keyPair);
		const detachKeyRequestHandler = e2ee.watchKeyRequests();
		const detachSubscriptionWatcher = e2ee.watchSubscriptions();
		const detachMessageReceivedTransform = onClientMessageReceived.use((msg) => e2ee.transformReceivedMessage(msg));
		const detachSendingMessageTransform = onClientBeforeSendMessage.use((msg) => e2ee.transformSendingMessage(msg));

		return (): void => {
			e2ee.unuse();
			detachKeyRequestHandler();
			detachSubscriptionWatcher();
			detachMessageReceivedTransform();
			detachSendingMessageTransform();
		};
	}, [keyPair]);

	const value: ContextType<typeof E2EEContext> = useMemo(
		(): ContextType<typeof E2EEContext> => ({
			supported,
			activable,
			enabled,
			active,
			keyPair,
		}),
		[supported, activable, enabled, active, keyPair],
	);

	return <E2EEContext.Provider children={children} value={value} />;
};

export default E2EEProvider;
