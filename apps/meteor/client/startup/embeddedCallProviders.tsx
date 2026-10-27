import { lazy } from 'react';

import { getRootUrlPathPrefix } from '../lib/meteorRuntimeConfig';
import type { EmbeddedCallProviderProps } from '../lib/videoConference/embeddedCallProviders';
import { embeddedCallProviders } from '../lib/videoConference/embeddedCallProviders';

const LiveKitCallProvider = lazy(() => import('@rocket.chat/ui-livekit'));

// Same origin and under the root path, since the page fetches an AudioWorklet module the way it fetches a script.
const rnnoiseBaseUrl = `${getRootUrlPathPrefix().replace(/\/+$/, '')}/video-conference/rnnoise`;

const LiveKitCall = ({ callId, connect, preferences, onEnded, children }: EmbeddedCallProviderProps) => (
	<LiveKitCallProvider callId={callId} connect={connect} preferences={preferences} onEnded={onEnded} rnnoiseBaseUrl={rnnoiseBaseUrl}>
		{children}
	</LiveKitCallProvider>
);

embeddedCallProviders.register('livekit', LiveKitCall);
