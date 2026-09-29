import { lazy } from 'react';

import { embeddedCallProviders } from '../lib/videoConference/embeddedCallProviders';

embeddedCallProviders.register(
	'livekit',
	lazy(() => import('../views/videoConference/livekit/LiveKitCallProvider')),
);
