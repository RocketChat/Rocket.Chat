import type { IMessage } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useChat } from '../../contexts/ChatContext';

export type ComposerActionsOptions = {
	tmid?: IMessage['_id'];
	onSend?: () => void;
};

export type ComposerSendInput = {
	value: string;
	tshow?: boolean;
	previewUrls?: string[];
	isSlashCommandAllowed?: boolean;
};

/** The things a composer can do to a room, so a composer only has to decide when to do them. */
export const useComposerActions = ({ tmid, onSend }: ComposerActionsOptions) => {
	const chat = useChat();
	const dispatchToastMessage = useToastMessageDispatch();

	return useMemo(
		() => ({
			onJoin: async (): Promise<void> => {
				try {
					await chat?.data?.joinRoom();
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
					throw error;
				}
			},

			onSend: async ({ value: text, tshow, previewUrls, isSlashCommandAllowed }: ComposerSendInput): Promise<void> => {
				try {
					await chat?.action.stop('typing');
					const newMessageSent = await chat?.flows.sendMessage({
						text,
						tshow,
						previewUrls,
						isSlashCommandAllowed,
						tmid,
					});
					if (newMessageSent) onSend?.();
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			},
			onTyping: async (): Promise<void> => {
				if (chat?.composer?.text?.trim() === '') {
					await chat?.action.stop('typing');
					return;
				}
				await chat?.action.start('typing');
			},
			onNavigateToPreviousMessage: () => chat?.messageEditing.toPreviousMessage(),
			onNavigateToNextMessage: () => chat?.messageEditing.toNextMessage(),
		}),
		[chat?.data, chat?.flows, chat?.action, chat?.composer?.text, chat?.messageEditing, dispatchToastMessage, tmid, onSend],
	);
};
