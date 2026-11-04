import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useAudioStream } from './useAudioStream';
import useAvailableViewTracker from './useAvailableViewTracker';
import { useGetAutocompleteOptions } from './useGetAutocompleteOptions';
import { useInstanceState } from './useInstanceState';
import { MediaCallInstanceContext } from '../context/MediaCallInstanceContext';

export type MediaCallInstanceProviderProps = {
	children: ReactNode;
	instance: MediaSignalingSession | undefined;
};

const MediaCallInstanceProvider = ({ children, instance }: MediaCallInstanceProviderProps) => {
	const { currentViews, registerView, unregisterView } = useAvailableViewTracker();

	const { openWidget, closeWidget, targetPeer, setTargetPeer, targetWidgetVisibility, openRoomId, setOpenRoomId } =
		useInstanceState(instance);

	const [remoteStreamRefCallback, audioElement] = useAudioStream(instance);

	const getAutocompleteOptions = useGetAutocompleteOptions(instance);

	const value = useMemo(
		() => ({
			instance,
			audioElement,
			openRoomId,
			setOpenRoomId,
			getAutocompleteOptions,
			currentViews,
			registerView,
			unregisterView,
			openWidget,
			closeWidget,
			setTargetPeer,
			targetPeer,
			targetWidgetVisibility,
		}),
		[
			instance,
			audioElement,
			openRoomId,
			setOpenRoomId,
			getAutocompleteOptions,
			currentViews,
			registerView,
			unregisterView,
			openWidget,
			closeWidget,
			setTargetPeer,
			targetPeer,
			targetWidgetVisibility,
		],
	);

	return (
		<MediaCallInstanceContext.Provider value={value}>
			{createPortal(
				<audio ref={remoteStreamRefCallback}>
					<track kind='captions' />
				</audio>,
				document.body,
			)}
			{children}
		</MediaCallInstanceContext.Provider>
	);
};

export default MediaCallInstanceProvider;
