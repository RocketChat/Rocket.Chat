import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { usePermission, useSetting, useUser } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

/**
 * The settings, permissions and viewer the message actions are decided from, for one room. Settings are kept as
 * read, without defaults, so each action applies the same default it always did.
 */
export type MessageActionsPolicy = {
	user: IUser | null;
	settings: {
		allowStarring: boolean | undefined;
		allowPinning: boolean | undefined;
		threadsEnabled: boolean | undefined;
		autoTranslateEnabled: boolean | undefined;
		webdavEnabled: boolean | undefined;
		allowEditing: boolean | undefined;
		blockEditInMinutes: number | undefined;
		discussionEnabled: boolean | undefined;
	};
	permissions: {
		pinMessage: boolean;
		editMessage: boolean;
		bypassEditTimeLimit: boolean;
		startDiscussion: boolean;
		startDiscussionOtherUser: boolean;
		autoTranslate: boolean;
		createDirectMessage: boolean;
	};
};

const MessageActionsPolicyContext = createContext<MessageActionsPolicy | undefined>(undefined);

export const useOptionalMessageActionsPolicy = (): MessageActionsPolicy | undefined => useContext(MessageActionsPolicyContext);

export const useMessageActionsPolicy = (): MessageActionsPolicy => {
	const policy = useContext(MessageActionsPolicyContext);
	if (!policy) {
		throw new Error('useMessageActionsPolicy must be used under a MessageActionsPolicyProvider');
	}
	return policy;
};

type MessageActionsPolicyProviderProps = {
	room: Pick<IRoom, '_id'>;
	children: ReactNode;
};

/** Reads what the message actions depend on once per room, instead of once per hovered message */
export const MessageActionsPolicyProvider = ({ room, children }: MessageActionsPolicyProviderProps) => {
	const user = useUser();

	const allowStarring = useSetting('Message_AllowStarring') as boolean | undefined;
	const allowPinning = useSetting('Message_AllowPinning') as boolean | undefined;
	const threadsEnabled = useSetting('Threads_enabled') as boolean | undefined;
	const autoTranslateEnabled = useSetting('AutoTranslate_Enabled') as boolean | undefined;
	const webdavEnabled = useSetting('Webdav_Integration_Enabled') as boolean | undefined;
	const allowEditing = useSetting('Message_AllowEditing') as boolean | undefined;
	const blockEditInMinutes = useSetting('Message_AllowEditing_BlockEditInMinutes') as number | undefined;
	const discussionEnabled = useSetting('Discussion_enabled') as boolean | undefined;

	const pinMessage = usePermission('pin-message', room._id);
	const editMessage = usePermission('edit-message', room._id);
	const bypassEditTimeLimit = usePermission('bypass-time-limit-edit-and-delete', room._id);
	const startDiscussion = usePermission('start-discussion', room._id);
	const startDiscussionOtherUser = usePermission('start-discussion-other-user', room._id);
	const autoTranslate = usePermission('auto-translate');
	const createDirectMessage = usePermission('create-d');

	const policy = useMemo(
		(): MessageActionsPolicy => ({
			user,
			settings: {
				allowStarring,
				allowPinning,
				threadsEnabled,
				autoTranslateEnabled,
				webdavEnabled,
				allowEditing,
				blockEditInMinutes,
				discussionEnabled,
			},
			permissions: {
				pinMessage,
				editMessage,
				bypassEditTimeLimit,
				startDiscussion,
				startDiscussionOtherUser,
				autoTranslate,
				createDirectMessage,
			},
		}),
		[
			user,
			allowStarring,
			allowPinning,
			threadsEnabled,
			autoTranslateEnabled,
			webdavEnabled,
			allowEditing,
			blockEditInMinutes,
			discussionEnabled,
			pinMessage,
			editMessage,
			bypassEditTimeLimit,
			startDiscussion,
			startDiscussionOtherUser,
			autoTranslate,
			createDirectMessage,
		],
	);

	return <MessageActionsPolicyContext.Provider value={policy}>{children}</MessageActionsPolicyContext.Provider>;
};
