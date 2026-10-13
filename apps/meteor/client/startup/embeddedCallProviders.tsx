import { lazy } from 'react';

import type { EmbeddedCallProviderProps } from '../lib/videoConference/embeddedCallProviders';
import { embeddedCallProviders } from '../lib/videoConference/embeddedCallProviders';
import { useMediaProcessorAssets } from '../views/conference/hooks/useMediaProcessorAssets';

const LiveKitCallProvider = lazy(() => import('@rocket.chat/ui-livekit'));

const LiveKitCall = ({ callId, connect, preferences, onEnded, children }: EmbeddedCallProviderProps) => {
	const assets = useMediaProcessorAssets();

	return (
		<LiveKitCallProvider callId={callId} connect={connect} preferences={preferences} onEnded={onEnded} assets={assets}>
			{children}
		</LiveKitCallProvider>
	);
};

embeddedCallProviders.register('livekit', LiveKitCall);
