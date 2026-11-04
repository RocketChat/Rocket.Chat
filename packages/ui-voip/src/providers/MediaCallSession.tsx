import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { AnchorPortal } from '@rocket.chat/ui-client';
import { useUser } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import MediaCallViewProvider from './MediaCallViewProvider';
import { useMediaSessionInstance } from './useMediaSessionInstance';
import MediaCallPopout from '../views/MediaCallPopout';
import MediaCallWidget from '../views/MediaCallWidget/MediaCallWidget';

export type MediaCallSessionProps = {
	enabled: boolean;
	onInstance: (instance: MediaSignalingSession | undefined) => void;
};

/** Runs the user's media call session and its widgets, handing the session up to the provider every call view reads. */
const MediaCallSession = ({ enabled, onInstance }: MediaCallSessionProps) => {
	const user = useUser();
	const instance = useMediaSessionInstance(user?._id, enabled);

	useEffect(() => onInstance(instance), [instance, onInstance]);

	if (!enabled) {
		return null;
	}

	return (
		<>
			<MediaCallViewProvider>
				<AnchorPortal id='rcx-media-call-widget-portal'>
					<MediaCallWidget />
				</AnchorPortal>
			</MediaCallViewProvider>
			<MediaCallPopout />
		</>
	);
};

export default MediaCallSession;
