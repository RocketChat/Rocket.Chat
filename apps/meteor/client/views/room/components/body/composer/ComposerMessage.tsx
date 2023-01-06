import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ContextType, ReactElement, ReactNode } from 'react';
import React, { memo, useCallback, useMemo } from 'react';

import { RoomManager } from '../../../../../../app/ui-utils/client';
import { useReactiveValue } from '../../../../../hooks/useReactiveValue';
import ComposerSkeleton from '../../../Room/ComposerSkeleton';
import type { ChatContext } from '../../../contexts/ChatContext';
import MessageBox from './messageBox/MessageBox';

export type ComposerMessageProps = {
	rid: IRoom['_id'];
	children?: ReactNode;
	subscription?: ISubscription;
	readOnly?: boolean;
	tshow?: boolean;
	chatMessagesInstance: ContextType<typeof ChatContext>;
	onResize?: () => void;
	onEscape?: () => void;
	onSend?: () => void;
	onNavigateToNextMessage?: () => void;
	onNavigateToPreviousMessage?: () => void;
	onUploadFiles?: (files: readonly File[]) => void;
};

const ComposerMessage = ({ rid, chatMessagesInstance, readOnly, onSend, ...props }: ComposerMessageProps): ReactElement => {
	const dispatchToastMessage = useToastMessageDispatch();

	const composerProps = useMemo(
		() => ({
			onJoin: async (): Promise<void> => {
				try {
					await chatMessagesInstance?.data?.joinRoom();
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
					throw error;
				}
			},

			onSend: async ({ value: text, tshow }: { value: string; tshow?: boolean }): Promise<void> => {
				try {
					await chatMessagesInstance?.flows.action.stop('typing');
					const newMessageSent = await chatMessagesInstance?.flows.sendMessage({
						text,
						tshow,
					});
					if (newMessageSent) onSend?.();
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			},
			onTyping: async (): Promise<void> => {
				if (chatMessagesInstance?.composer?.text?.trim() === '') {
					await chatMessagesInstance?.flows.action.stop('typing');
					return;
				}
				await chatMessagesInstance?.flows.action.start('typing');
			},
			onNavigateToPreviousMessage: () => chatMessagesInstance?.messageEditing.toPreviousMessage(),
			onNavigateToNextMessage: () => chatMessagesInstance?.messageEditing.toNextMessage(),
			onUploadFiles: (files: readonly File[]) => {
				return chatMessagesInstance?.flows.uploadFiles(files);
			},
		}),
		[
			chatMessagesInstance?.data,
			chatMessagesInstance?.flows,
			chatMessagesInstance?.composer?.text,
			chatMessagesInstance?.messageEditing,
			dispatchToastMessage,
			onSend,
		],
	);

	const publicationReady = useReactiveValue(useCallback(() => RoomManager.getOpenedRoomByRid(rid)?.streamActive ?? false, [rid]));

	if (!publicationReady) {
		return (
			<footer className='footer'>
				<ComposerSkeleton />
			</footer>
		);
	}

	return (
		<MessageBox
			readOnly={readOnly ?? false}
			rid={rid}
			{...composerProps}
			showFormattingTips={true}
			{...props}
			chatContext={chatMessagesInstance}
		/>
	);
};

export default memo(ComposerMessage);
