import type { UiKit } from '@rocket.chat/core-typings';
import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useAppUiKitInteraction = (handleServerInteraction: (interaction: UiKit.ServerInteraction) => void) => {
	const notifyUser = useStream('notify-user');
	const uid = useUserId();

	useEffect(() => {
		if (!uid) {
			return;
		}

		return notifyUser(`${uid}/uiInteraction`, (interaction) => {
			// @ts-ignore
			handleServerInteraction(interaction);
		});
	}, [notifyUser, uid, handleServerInteraction]);
};
