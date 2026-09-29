import { lazy } from 'react';

import { embeddedCallProviders } from '../lib/videoConference/embeddedCallProviders';

const LiveKitCallProvider = lazy(() => import('@rocket.chat/ui-livekit'));

embeddedCallProviders.register('livekit', LiveKitCallProvider);
