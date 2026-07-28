import { Emitter } from '@rocket.chat/emitter';
import { useUser } from '@rocket.chat/ui-contexts';
import { useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useAudioStream } from './useAudioStream';
import useAvailableViewTracker from './useAvailableViewTracker';
import { useGetAutocompleteOptions } from './useGetAutocompleteOptions';
import { useMediaSessionInstance } from './useMediaSessionInstance';
import { useMediaSessionStateSubscription } from './useMediaSessionStateSubscription';
import { usePersistedSessionState } from './usePersistedSessionState';
import { MediaCallInstanceContext } from '../context/MediaCallInstanceContext';
import type { Signals } from '../context/MediaCallInstanceContext';

export type MediaCallInstanceProviderProps = {
	children: ReactNode;
	enabled?: boolean;
};

const MediaCallInstanceProvider = ({ children, enabled = true }: MediaCallInstanceProviderProps) => {
	const [openRoomId, setOpenRoomId] = useState<string | undefined>(undefined);
	const { currentViews, registerView, unregisterView } = useAvailableViewTracker();
	const user = useUser();
	const instance = useMediaSessionInstance(user?._id, enabled);
	const [signalEmitter] = useState(() => new Emitter<Signals>());

	const stateSubscription = useMediaSessionStateSubscription();
	const { openWidget, closeWidget, targetPeer, setTargetPeer, widgetVisibility } = usePersistedSessionState(stateSubscription, instance);
	const { subscribe, getSnapshot } = stateSubscription;

	const [remoteStreamRefCallback, audioElement] = useAudioStream(instance);

	const getAutocompleteOptions = useGetAutocompleteOptions(instance);

	const value = useMemo(
		() => ({
			instance,
			signalEmitter,
			audioElement,
			openRoomId,
			setOpenRoomId,
			getAutocompleteOptions,
			currentViews,
			registerView,
			unregisterView,
			stateSubscription: {
				subscribe,
				getSnapshot,
			},
			openWidget,
			closeWidget,
			setTargetPeer,
			targetPeer,
			widgetVisibility,
		}),
		[
			instance,
			signalEmitter,
			audioElement,
			openRoomId,
			getAutocompleteOptions,
			currentViews,
			registerView,
			unregisterView,
			subscribe,
			getSnapshot,
			openWidget,
			closeWidget,
			setTargetPeer,
			targetPeer,
			widgetVisibility,
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
