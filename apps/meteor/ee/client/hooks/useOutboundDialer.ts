import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useEffect, useState } from 'react';

// import { useVoipClient } from '../../../client/providers/CallProvider/hooks/useVoipClient';
import { useCallClient } from '../../../client/contexts/CallContext';
import { hasLicense } from '../../app/license/client';
import { EEVoipClient } from '../lib/voip/EEVoipClient';

type UseOutboundDialerResult = {
	outboundDialer?: EEVoipClient;
	error?: Error | unknown;
};

const empty = {};

export const useOutboundDialer = (): UseOutboundDialerResult => {
	const [result, setResult] = useSafely(useState<UseOutboundDialerResult>({}));
	const voipClient = useCallClient();
	useEffect(() => {
		if (!voipClient) {
			setResult(empty);
			return;
		}
		hasLicense('voip-enterprise').then((enabled) => {
			if (!enabled) {
				return;
			}
			if (voipClient instanceof EEVoipClient) {
				setResult({ outboundDialer: voipClient as EEVoipClient });
			}
		});

		return (): void => {
			hasLicense('voip-enterprise').then((enabled) => {
				if (!enabled) {
					return;
				}
				if (voipClient) {
					voipClient.clear();
				}
			});
		};
	}, [setResult, voipClient]);

	return result;
};
