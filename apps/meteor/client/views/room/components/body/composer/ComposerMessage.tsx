import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { memo, useCallback, useMemo } from 'react';

import { RoomManager } from '../../../../../../app/ui-utils/client';
import { useReactiveValue } from '../../../../../hooks/useReactiveValue';
import ComposerSkeleton from '../../../Room/ComposerSkeleton';
import { useChat } from '../../../contexts/ChatContext';
import MessageBox from './messageBox/MessageBox';

export type ComposerMessageProps = {
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
	children?: ReactNode;
	subscription?: ISubscription;
	readOnly?: boolean;
	tshow?: boolean;
	onResize?: () => void;
	onEscape?: () => void;
	onSend?: () => void;
	onNavigateToNextMessage?: () => void;
	onNavigateToPreviousMessage?: () => void;
	onUploadFiles?: (files: readonly File[]) => void;
};

const ComposerMessage = ({ rid, tmid, readOnly, onSend, ...props }: ComposerMessageProps): ReactElement => {
	const chat = useChat();
	const dispatchToastMessage = useToastMessageDispatch();

	const composerProps = useMemo(
		() => ({
			onJoin: async (): Promise<void> => {
				try {
					await chat?.data?.joinRoom();
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
					throw error;
				}
			},

			onSend: async ({ value: text, tshow }: { value: string; tshow?: boolean }): Promise<void> => {
				try {
					await chat?.flows.action.stop('typing');
					const newMessageSent = await chat?.flows.sendMessage({
						text,
						tshow,
					});
					if (newMessageSent) onSend?.();
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
			},
			onTyping: async (): Promise<void> => {
				if (chat?.composer?.text?.trim() === '') {
					await chat?.flows.action.stop('typing');
					return;
				}
				await chat?.flows.action.start('typing');
			},
			onNavigateToPreviousMessage: () => chat?.messageEditing.toPreviousMessage(),
			onNavigateToNextMessage: () => chat?.messageEditing.toNextMessage(),
			onUploadFiles: (files: readonly File[]) => {
				return chat?.flows.uploadFiles(files);
			},
		}),
		[chat?.data, chat?.flows, chat?.composer?.text, chat?.messageEditing, dispatchToastMessage, onSend],
	);

	const publicationReady = useReactiveValue(useCallback(() => RoomManager.getOpenedRoomByRid(rid)?.streamActive ?? false, [rid]));

	if (!publicationReady) {
		return (
			<footer className='footer'>
				<ComposerSkeleton />
			</footer>
		);
	}

	return <MessageBox readOnly={readOnly ?? false} rid={rid} tmid={tmid} {...composerProps} showFormattingTips={true} {...props} />;
};

export default memo(ComposerMessage);
