import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useEffect } from 'react';

export const useAppUiKitInteraction = (handleServerInteraction: (interaction: UiKit.ServerInteraction) => void) => {
	const notifyUser = useStream('notify-user');
	const uid = useUserId();

	useEffect(() => {
		if (!uid) {
			return;
		}

		return notifyUser(`${uid}/uiInteraction`, (interaction) => {
			handleServerInteraction(interaction);
		});
	}, [notifyUser, uid, handleServerInteraction]);
};
