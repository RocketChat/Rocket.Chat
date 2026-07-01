import { Emitter } from '@rocket.chat/emitter';
import { useUser } from '@rocket.chat/ui-contexts';
import { useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useAudioStream } from './useAudioStream';
import useAvailableViewTracker from './useAvailableViewTracker';
import { useGetAutocompleteOptions } from './useGetAutocompleteOptions';
import { useMediaSessionInstance } from './useMediaSessionInstance';
import { MediaCallInstanceContext } from '../context/MediaCallInstanceContext';
import type { Signals } from '../context/MediaCallInstanceContext';
import { AppActionOverridesProvider } from '../experimental/AppActionButtons';

type MediaCallInstanceProviderProps = {
	children: ReactNode;
};

const MediaCallInstanceProvider = ({ children }: MediaCallInstanceProviderProps) => {
	const [openRoomId, setOpenRoomId] = useState<string | undefined>(undefined);
	const { currentViews, registerView, unregisterView } = useAvailableViewTracker();
	const user = useUser();
	const instance = useMediaSessionInstance(user?._id);
	const [signalEmitter] = useState(() => new Emitter<Signals>());

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
		}),
		[instance, signalEmitter, audioElement, openRoomId, setOpenRoomId, getAutocompleteOptions, currentViews, registerView, unregisterView],
	);

	return (
		<MediaCallInstanceContext.Provider value={value}>
			<AppActionOverridesProvider>
				{createPortal(
					<audio ref={remoteStreamRefCallback}>
						<track kind='captions' />
					</audio>,
					document.body,
				)}
				{children}
			</AppActionOverridesProvider>
		</MediaCallInstanceContext.Provider>
	);
};

export default MediaCallInstanceProvider;
