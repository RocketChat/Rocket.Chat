import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import type { ContextType, ReactElement } from 'react';
import React, { memo, useCallback, useEffect, useRef } from 'react';

import type { MessageBoxTemplateInstance } from '../../../../../../app/ui-message/client/messageBox/messageBox';
import { RoomManager } from '../../../../../../app/ui-utils/client';
import { useEmbeddedLayout } from '../../../../../hooks/useEmbeddedLayout';
import { useReactiveValue } from '../../../../../hooks/useReactiveValue';
import ComposerSkeleton from '../../../Room/ComposerSkeleton';
import type { ChatContext } from '../../../contexts/ChatContext';

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

const ComposerMessage = ({
	rid,
	subscription,
	chatMessagesInstance,
	onResize,
	onEscape,
	onNavigateToNextMessage,
	onNavigateToPreviousMessage,
	onUploadFiles,
}: ComposerMessageProps): ReactElement => {
	const isLayoutEmbedded = useEmbeddedLayout();
	const showFormattingTips = useSetting('Message_ShowFormattingTips') as boolean;

	const messageBoxViewRef = useRef<Blaze.View>();
	const messageBoxViewDataRef = useRef(
		new ReactiveVar<MessageBoxTemplateInstance['data']>({
			rid,
			subscription,
			isEmbedded: isLayoutEmbedded,
			showFormattingTips: showFormattingTips && !isLayoutEmbedded,
			onResize,
			onEscape,
			onNavigateToNextMessage,
			onNavigateToPreviousMessage,
			onUploadFiles,
			chatContext: chatMessagesInstance,
		}),
	);

	useEffect(() => {
		messageBoxViewDataRef.current.set({
			rid,
			subscription,
			isEmbedded: isLayoutEmbedded,
			showFormattingTips: showFormattingTips && !isLayoutEmbedded,
			onResize,
			onEscape,
			onNavigateToNextMessage,
			onNavigateToPreviousMessage,
			onUploadFiles,
			chatContext: chatMessagesInstance,
		});
	}, [
		isLayoutEmbedded,
		onResize,
		rid,
		showFormattingTips,
		subscription,
		chatMessagesInstance,
		onEscape,
		onNavigateToNextMessage,
		onNavigateToPreviousMessage,
		onUploadFiles,
	]);

	const dispatchToastMessage = useToastMessageDispatch();

	const footerRef = useCallback(
		(footer: HTMLElement | null) => {
			if (footer) {
				messageBoxViewRef.current = Blaze.renderWithData(
					Template.messageBox,
					(): MessageBoxTemplateInstance['data'] => ({
						...messageBoxViewDataRef.current.get(),
						onSend: async (
							_event: Event,
							{
								value: text,
								tshow,
							}: {
								value: string;
								tshow?: boolean;
							},
						): Promise<void> => {
							try {
								await chatMessagesInstance?.flows.sendMessage({
									text,
									tshow,
								});
							} catch (error) {
								dispatchToastMessage({ type: 'error', message: error });
							}
						},
					}),
					footer,
				);
				return;
			}

			if (messageBoxViewRef.current) {
				Blaze.remove(messageBoxViewRef.current);
				messageBoxViewRef.current = undefined;
			}
		},
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

	return <footer ref={footerRef} className='footer' />;
};

export default memo(ComposerMessage);
