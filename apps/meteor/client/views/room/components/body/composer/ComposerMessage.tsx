import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ContextType, ReactElement } from 'react';
import React, { memo, useCallback, useMemo } from 'react';

import { RoomManager } from '../../../../../../app/ui-utils/client';
import { useReactiveValue } from '../../../../../hooks/useReactiveValue';
import ComposerSkeleton from '../../../Room/ComposerSkeleton';
import type { ChatContext } from '../../../contexts/ChatContext';
import MessageBox from './LegacyComposer/MessageBox';

export type ComposerMessageProps = {
	rid: IRoom['_id'];
	subscription?: ISubscription;
	chatMessagesInstance: ContextType<typeof ChatContext>;
	onResize?: () => void;
	onEscape?: () => void;
	onNavigateToNextMessage?: () => void;
	onNavigateToPreviousMessage?: () => void;
	onUploadFiles?: (files: readonly File[]) => void;
};

const ComposerMessage = ({ rid, chatMessagesInstance, ...props }: ComposerMessageProps): ReactElement => {
	const showFormattingTips = useSetting('Message_ShowFormattingTips') as boolean;

	const dispatchToastMessage = useToastMessageDispatch();

	const composerProp = useMemo(
		() => ({
			onSend: async ({ value: text, tshow }: { value: string; tshow?: boolean }): Promise<void> => {
				try {
					await chatMessagesInstance?.flows.sendMessage({
						text,
						tshow,
					});

					await chatMessagesInstance?.composer?.setText('');
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
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

	return <MessageBox rid={rid} {...composerProp} {...props} showFormattingTips={showFormattingTips} chatContext={chatMessagesInstance} />;
};

export default memo(ComposerMessage);
