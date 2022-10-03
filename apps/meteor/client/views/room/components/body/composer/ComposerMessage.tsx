import { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import React, { memo, ReactElement, useCallback, useEffect, useRef, useMemo } from 'react';

import { EmojiPicker } from '../../../../../../app/emoji/client';
import { ChatMessages } from '../../../../../../app/ui';
import { MessageboxPropTypes } from '../../../../../../app/ui-message/client/messageBox/messageBox';
import { RoomManager } from '../../../../../../app/ui-utils/client';
import { useEmbeddedLayout } from '../../../../../hooks/useEmbeddedLayout';
import { useReactiveValue } from '../../../../../hooks/useReactiveValue';
import ComposerSkeleton from '../../../Room/ComposerSkeleton';
import { RoomComposer } from './RoomComposer';
import { useExperimentalComposer } from './hooks/useExperimentalComposer';

export type ComposerMessageProps = {
	rid: IRoom['_id'];
	subscription?: ISubscription;
	chatMessagesInstance: ChatMessages;
	onResize?: () => void;
};

const ComposerMessage = ({ rid, subscription, chatMessagesInstance, onResize, tmid }: ComposerMessageProps): ReactElement => {
	const experimental = useExperimentalComposer();
	const isLayoutEmbedded = useEmbeddedLayout();
	const showFormattingTips = useSetting('Message_ShowFormattingTips') as boolean;
	const sendOnEnter = useUserPreference<'enter' | 'desktop'>('sendOnEnter');
	const useEmojis = useUserPreference<boolean>('useEmojis');

	const messageBoxViewRef = useRef<Blaze.View>();
	const messageBoxViewDataRef = useRef(
		new ReactiveVar({
			rid,
			subscription,
			isEmbedded: isLayoutEmbedded,
			showFormattingTips: showFormattingTips && !isLayoutEmbedded,
			onResize,
		}),
	);

	useEffect(() => {
		messageBoxViewDataRef.current.set({
			rid,
			subscription,
			isEmbedded: isLayoutEmbedded,
			showFormattingTips: showFormattingTips && !isLayoutEmbedded,
			onResize,
		});
	}, [isLayoutEmbedded, onResize, rid, showFormattingTips, subscription]);

	const data: MessageboxPropTypes = useMemo(
		() => ({
			...messageBoxViewDataRef.current.get(),
			onInputChanged: (input: HTMLTextAreaElement): void => {
				chatMessagesInstance.initializeInput(input, { rid });
			},
			onKeyUp: (event: KeyboardEvent) => chatMessagesInstance.keyup(event, { rid, tmid }),
			onKeyDown: (event: KeyboardEvent) => chatMessagesInstance.keydown(event),
			onSend: (
				event: Event,
				params: {
					// rid: string;
					// tmid?: string;
					value: string;
					tshow?: boolean;
				},
				done?: () => void,
			) =>
				chatMessagesInstance.send(
					event,
					{
						...params,
						rid,
						tmid,
					},
					done,
				),
			sendOnEnter,
			openEmojiPicker: (event: Event, input: HTMLTextAreaElement): void => {
				event.stopPropagation();
				event.preventDefault();

				if (!useEmojis) {
					return;
				}

				if (EmojiPicker.isOpened()) {
					EmojiPicker.close();
					return;
				}

				EmojiPicker.open(event.currentTarget, (emoji: string) => {
					const emojiValue = `:${emoji}: `;

					const caretPos = input.selectionStart;
					const textAreaTxt = input.value;

					input.focus();
					if (!document.execCommand || !document.execCommand('insertText', false, emojiValue)) {
						input.value = textAreaTxt.substring(0, caretPos) + emojiValue + textAreaTxt.substring(caretPos);
						input.focus();
					}

					input.selectionStart = caretPos + emojiValue.length;
					input.selectionEnd = caretPos + emojiValue.length;
				});
			},
			useEmojis,
			tmid,
			tshow: false,
		}),
		[sendOnEnter, chatMessagesInstance, rid, tmid, useEmojis],
	);

	const footerRef = useCallback(
		(footer: HTMLElement | null) => {
			if (footer) {
				messageBoxViewRef.current = Blaze.renderWithData(Template.messageBox, () => data, footer);
				return;
			}

			if (messageBoxViewRef.current) {
				Blaze.remove(messageBoxViewRef.current);
				messageBoxViewRef.current = undefined;
			}
		},
		[data],
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
		<>
			{experimental && <RoomComposer {...data} />}
			{!experimental && <footer ref={footerRef} className='footer' />}
		</>
	);
};

export default memo(ComposerMessage);
