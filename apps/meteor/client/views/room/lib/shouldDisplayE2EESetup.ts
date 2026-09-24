import type { IRoom } from '@rocket.chat/core-typings';

/** Whether an encrypted room shows its E2EE setup instead of its regular header and body */
export const shouldDisplayE2EESetup = (
	room: Pick<IRoom, 'encrypted'>,
	{ e2eEnabled, unencryptedMessagesAllowed }: { e2eEnabled: boolean; unencryptedMessagesAllowed: boolean },
): boolean => Boolean(room.encrypted) && e2eEnabled && !unencryptedMessagesAllowed;
