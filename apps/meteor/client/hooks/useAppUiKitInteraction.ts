import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useEffect } from 'react';

export const useAppUiKitInteraction = (handleServerInteraction: (interaction: UiKit.ServerInteraction) => void) => {
	const notifyUser = useStream('notify-user');
	const uid = useUserId();

	const handle = useEffectEvent(handleServerInteraction);
	useEffect(() => {
		if (!uid) {
			return;
		}

		return notifyUser(`${uid}/uiInteraction`, handle);
	}, [notifyUser, uid, handle]);
};
