import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React, { memo, useCallback, useMemo } from 'react';

import { LegacyRoomManager } from '../../../../app/ui-utils/client';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { useChat } from '../contexts/ChatContext';
import ComposerSkeleton from './ComposerSkeleton';
import MessageBox from './messageBox/MessageBox';

export type ComposerMessageProps = {
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
	children?: ReactNode;
	subscription?: ISubscription;
	readOnly?: boolean;
	tshow?: boolean;
	previewUrls?: string[];
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

			onSend: async ({ value: text, tshow, previewUrls }: { value: string; tshow?: boolean; previewUrls?: string[] }): Promise<void> => {
				try {
					await chat?.action.stop('typing');
					const newMessageSent = await chat?.flows.sendMessage({
						text,
						tshow,
						previewUrls,
					});
					if (newMessageSent) onSend?.();
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}

				// Check mention function
				// const regex = new RegExp(`(^|\\s|>)@(${settings.get('UTF8_User_Names_Validation')}(@(${settings.get('UTF8_User_Names_Validation')}))?(:([0-9a-zA-Z-_.]+))?)`, 'gm');
				const mentionsList = text.match(/@[0-9a-zA-Z-_.]+/gi);
				console.log('resp', mentionsList);

				// Check if user is in the channel
				// -- Code --

				// Send message
				await chat?.data.pushEphemeralMessage({
					_id: Random.id(),
					ts: new Date(),
					msg: 'Message here',
					u: {
						_id: 'rocket.cat',
						username: 'rocket.cat',
						name: 'Rocket.Cat',
					},
					blocks: [
						{
							type: 'section',
							text: {
								type: 'mrkdwn',
								text: 'You mentioned *Rachel Berry*, but they are not in this room <https://google.com|this is a link>',
							},
						},
						{
							type: 'actions',
							elements: [
								{
									type: 'button',
									appId: 'app-id',
									blockId: 'block-id',
									actionId: 'action-id',
									text: {
										type: 'plain_text',
										text: 'Add them',
									},
									url: 'teste',
								},
								{
									type: 'button',
									appId: 'app-id',
									blockId: 'block-id',
									actionId: 'action-id',
									text: {
										type: 'plain_text',
										text: 'Do nothing',
									},
									url: 'teste',
								},
								{
									type: 'button',
									appId: 'app-id',
									blockId: 'block-id',
									actionId: 'action-id',
									text: {
										type: 'plain_text',
										text: 'Let them know',
									},
									url: 'teste',
								},
							],
						},
					],
					private: true,
					_updatedAt: new Date(),
				});
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
			onUploadFiles: (files: readonly File[]) => {
				return chat?.flows.uploadFiles(files);
			},
		}),
		[chat?.data, chat?.flows, chat?.action, chat?.composer?.text, chat?.messageEditing, dispatchToastMessage, onSend],
	);

	const publicationReady = useReactiveValue(useCallback(() => LegacyRoomManager.getOpenedRoomByRid(rid)?.streamActive ?? false, [rid]));

	if (!publicationReady) {
		return <ComposerSkeleton />;
	}

	return (
		<MessageBox readOnly={readOnly ?? false} key={rid} rid={rid} tmid={tmid} {...composerProps} showFormattingTips={true} {...props} />
	);
};

export default memo(ComposerMessage);
