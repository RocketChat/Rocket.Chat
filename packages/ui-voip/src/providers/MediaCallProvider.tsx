import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import type { ReactNode } from 'react';
import { lazy, Suspense, useState } from 'react';

import MediaCallInstanceProvider from './MediaCallInstanceProvider';

const MediaCallSession = lazy(() => import('./MediaCallSession'));

export type MediaCallProviderProps = {
	children: ReactNode;
	enabled?: boolean;
};

/** Media calls for the user, downloaded the first time they are enabled. */
const MediaCallProvider = ({ children, enabled = true }: MediaCallProviderProps) => {
	const [instance, setInstance] = useState<MediaSignalingSession>();
	// Once started, the session stays mounted so that disabling calls ends it.
	const [started, setStarted] = useState(enabled);
	if (enabled && !started) {
		setStarted(true);
	}

	return (
		<MediaCallInstanceProvider instance={instance}>
			{started && (
				<Suspense fallback={null}>
					<MediaCallSession enabled={enabled} onInstance={setInstance} />
				</Suspense>
			)}
			{children}
		</MediaCallInstanceProvider>
	);
};

export default MediaCallProvider;
