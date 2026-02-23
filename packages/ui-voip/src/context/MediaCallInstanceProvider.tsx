import { Emitter } from '@rocket.chat/emitter';
import { useUser } from '@rocket.chat/ui-contexts';
import { useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { MediaCallInstanceContext, type Signals } from './MediaCallInstanceContext';
import { useGetAutocompleteOptions } from './useGetAutocompleteOptions';
import { useMediaSessionInstance } from './useMediaSessionInstance';
import useMediaStream from './useMediaStream';

type MediaCallInstanceProviderProps = {
	children: ReactNode;
};

const MediaCallInstanceProvider = ({ children }: MediaCallInstanceProviderProps) => {
	const [openRoomId, setOpenRoomId] = useState<string | undefined>(undefined);
	const user = useUser();
	const instance = useMediaSessionInstance(user?._id);
	const [signalEmitter] = useState(() => new Emitter<Signals>());

	const [remoteStreamRefCallback, audioElement] = useMediaStream(instance);

	const getAutocompleteOptions = useGetAutocompleteOptions(instance);

	const value = useMemo(
		() => ({ instance, signalEmitter, audioElement, openRoomId, setOpenRoomId, getAutocompleteOptions }),
		[instance, signalEmitter, audioElement, openRoomId, setOpenRoomId, getAutocompleteOptions],
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
