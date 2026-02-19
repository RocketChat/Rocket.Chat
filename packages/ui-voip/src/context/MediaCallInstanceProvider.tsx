import { Emitter } from '@rocket.chat/emitter';
import { useEndpoint, useSetting, useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { MediaCallInstanceContext, type Signals } from './MediaCallInstanceContext';
import { getExtensionFromInstanceContact } from './useMediaSession';
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

	const forceSIPRouting = useSetting('VoIP_TeamCollab_SIP_Integration_For_Internal_Calls');

	const usersAutoCompleteEndpoint = useEndpoint('GET', '/v1/users.autocomplete');

	const getAvatarPath = useUserAvatarPath();

	const getAutocompleteOptions = useCallback(
		async (filter: string) => {
			if (!instance) {
				return [];
			}

			const contact = instance.getMainCall()?.contact;

			const peerUsername = contact && 'username' in contact ? contact.username : undefined;
			const peerExtension = contact ? getExtensionFromInstanceContact(contact) : undefined;

			const conditions =
				peerExtension || forceSIPRouting
					? {
							$and: [
								forceSIPRouting && { freeSwitchExtension: { $exists: true } },
								peerExtension && { freeSwitchExtension: { $ne: peerExtension } },
							].filter(Boolean),
						}
					: undefined;

			const exceptions = [user?.username, peerUsername].filter(Boolean);

			const { items } = await usersAutoCompleteEndpoint({
				selector: JSON.stringify({ term: filter, exceptions, ...(conditions && { conditions }) }),
			});
			return (
				items.map((user) => {
					const label = user.name || user.username;
					// TODO: This endpoint does not provide the extension number, which is necessary to show in the UI.
					const identifier = user.username !== label ? user.username : undefined;

					return {
						value: user._id,
						label,
						identifier,
						status: user.status,
						avatarUrl: getAvatarPath({ username: user.username, etag: user.avatarETag }),
					};
				}) || []
			);
		},
		[instance, user, forceSIPRouting, usersAutoCompleteEndpoint, getAvatarPath],
	);

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
