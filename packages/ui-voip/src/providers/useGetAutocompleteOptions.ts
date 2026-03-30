import type { MediaSignalingSession } from '@rocket.chat/media-signaling';
import { useEndpoint, useSetting, useUser, useUserAvatarPath } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { getExtensionFromInstanceContact } from './useMediaSession';

export const useGetAutocompleteOptions = (instance: MediaSignalingSession | undefined) => {
	const user = useUser();
	const forceSIPRouting = useSetting('VoIP_TeamCollab_SIP_Integration_For_Internal_Calls');
	const usersAutoCompleteEndpoint = useEndpoint('GET', '/v1/users.autocomplete');
	const getAvatarPath = useUserAvatarPath();

	return useCallback(
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
};
