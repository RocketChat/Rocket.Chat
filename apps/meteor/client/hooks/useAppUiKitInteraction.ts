import type { UIKitInteractionType } from '@rocket.chat/apps-engine/definition/uikit';
import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useAppUiKitInteraction = (
	handlePayloadUserInteraction: (
		type: UIKitInteractionType,
		data: {
			triggerId: string;
			appId: string;
		},
	) => void,
) => {
	const notifyUser = useStream('notify-user');
	const uid = useUserId();

	useEffect(() => {
		if (!uid) {
			return;
		}

		return notifyUser(`${uid}/uiInteraction`, ({ type, ...data }) => {
			handlePayloadUserInteraction(type, data);
		});
	}, [notifyUser, uid, handlePayloadUserInteraction]);
};
