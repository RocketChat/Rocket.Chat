import type { IRoom } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';

/** Answers whether the room has to be set up for encryption before it can be used at all. */
export const useShouldDisplayE2EESetup = (room: IRoom): boolean => {
	const isE2EEnabled = useSetting('E2E_Enable', false);
	const unencryptedMessagesAllowed = useSetting('E2E_Allow_Unencrypted_Messages', false);

	return Boolean(room.encrypted) && !unencryptedMessagesAllowed && Boolean(isE2EEnabled);
};
