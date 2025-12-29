import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';

import { Callbacks } from './Callbacks';

/**
 * Callbacks returning void, like event listeners.
 *
 * TODO: move those to event-based systems
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
interface EventLikeCallbackSignatures {
	afterCreateChannel: (owner: IUser, room: IRoom) => void;
	afterSaveMessage: (message: IMessage, params: { room: IRoom; user: IUser; roomUpdater?: Updater<IRoom> }) => void;
	usernameSet: () => void;
}

/**
 * Callbacks that are supposed to be composed like a chain.
 *
 * TODO: develop a middleware alternative and grant independence of execution order
 */
type ChainedCallbackSignatures = {
	roomNameChanged: (room: IRoom) => void;
	roomTopicChanged: (room: IRoom) => void;
	roomAnnouncementChanged: (room: IRoom) => void;
	roomTypeChanged: (room: IRoom) => void;
	archiveRoom: (room: IRoom) => void;
	unarchiveRoom: (room: IRoom) => void;
	roomAvatarChanged: (room: IRoom) => void;
};

export type Hook =
	| keyof EventLikeCallbackSignatures
	| keyof ChainedCallbackSignatures
	| 'loginPageStateChange'
	| 'streamMessage'
	| 'streamNewMessage'
	| 'userAvatarSet'
	| 'userConfirmationEmailRequested'
	| 'userForgotPasswordEmailRequested'
	| 'userPasswordReset'
	| 'userRegistered'
	| 'userStatusManuallySet'
	| 'test';

/**
 * Callback hooks provide an easy way to add extra steps to common operations.
 * @deprecated
 */
export const clientCallbacks = new Callbacks<
	{
		[key in keyof ChainedCallbackSignatures]: ChainedCallbackSignatures[key];
	},
	{
		[key in keyof EventLikeCallbackSignatures]: EventLikeCallbackSignatures[key];
	},
	Hook
>();
