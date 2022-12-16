import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ContextType, ReactElement } from 'react';
import React, { memo, useCallback, useMemo } from 'react';

import { RoomManager } from '../../../../../../app/ui-utils/client';
import { useReactiveValue } from '../../../../../hooks/useReactiveValue';
import ComposerSkeleton from '../../../Room/ComposerSkeleton';
import type { ChatContext } from '../../../contexts/ChatContext';
import MessageBox from './messageBox/MessageBox';

export type ComposerMessageProps = {
	rid: IRoom['_id'];
	subscription?: ISubscription;
	readOnly?: boolean;
	chatMessagesInstance: ContextType<typeof ChatContext>;
	onResize?: () => void;
	onEscape?: () => void;
	onNavigateToNextMessage?: () => void;
	onNavigateToPreviousMessage?: () => void;
	onUploadFiles?: (files: readonly File[]) => void;
};

const ComposerMessage = ({ rid, chatMessagesInstance, readOnly, ...props }: ComposerMessageProps): ReactElement => {
	const dispatchToastMessage = useToastMessageDispatch();

	const composerProps = useMemo(
		() => ({
			onSend: async ({ value: text, tshow }: { value: string; tshow?: boolean }): Promise<void> => {
				try {
					await chatMessagesInstance?.flows.action.stop('typing');
					await chatMessagesInstance?.flows.sendMessage({
						text,
						tshow,
					});
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
		[chatMessagesInstance, dispatchToastMessage],
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
