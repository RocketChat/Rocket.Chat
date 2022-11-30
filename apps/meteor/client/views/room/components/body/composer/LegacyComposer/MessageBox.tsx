import { Box } from '@rocket.chat/fuselage';
import { useMutableCallback, useStableArray } from '@rocket.chat/fuselage-hooks';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { useTranslation, useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import React, { memo, MouseEventHandler, ReactElement, useEffect, useRef } from 'react';

import { EmojiPicker } from '../../../../../../../app/emoji/client';
import { createComposerAPI } from '../../../../../../../app/ui-message/client/messageBox/createComposerAPI';
import { MessageBoxTemplateInstance } from '../../../../../../../app/ui-message/client/messageBox/messageBox';
import { applyFormatting, formattingButtons } from '../../../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { messageBox, popover } from '../../../../../../../app/ui-utils/client';
import { useChat } from '../../../../contexts/ChatContext';
import BlazeTemplate from '../../../BlazeTemplate';
import { useAutoGrow } from '../RoomComposer/hooks/useAutoGrow';
import UserActionIndicator from '../UserActionIndicator';
import { useComposeChainEvents } from '../hooks/useComposeChainEvents';
import { useMessageComposerArrowNavigation } from '../hooks/useMessageComposerArrowNavigation';
import { useMessageComposerHandleSubmit } from '../hooks/useMessageComposerHandleSubmit';
import MessageBoxReplies from './MessageBoxReplies';

type MessageBoxProps = {} & MessageBoxTemplateInstance['data'];

// eslint-disable-next-line react/display-name, arrow-body-style
export const MessageBox = ({
	rid,
	tmid,
	isEmbedded,
	onSend,
	onNavigateToNextMessage,
	onNavigateToPreviousMessage,
	onEscape,
	showFormattingTips,
	subscription,
}: MessageBoxProps): ReactElement => {
	const t = useTranslation();

	const chat = useChat();

	if (!chat) {
		throw new Error('Chat context not found');
	}

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const shadowRef = useRef(null);

	const maxLength = useSetting('Message_MaxAllowedSize');

	const useEmojis = useUserPreference<boolean>('useEmojis');

	const handleOpenEmojiPicker: MouseEventHandler<HTMLElement> = useMutableCallback((e) => {
		e.stopPropagation();
		e.preventDefault();

		if (!useEmojis) {
			return;
		}

		if (EmojiPicker.isOpened()) {
			EmojiPicker.close();
			return;
		}

		EmojiPicker.open(e.currentTarget, (emoji: string) => {
			const emojiValue = `:${emoji}: `;
			chat?.composer?.insertText(emojiValue);
		});
	});

	useEffect(() => {
		if (!chat || chat.composer) {
			return;
		}
		const storageID = `${rid}${tmid ? `-${tmid}` : ''}`;
		chat.setComposerAPI(createComposerAPI(textareaRef.current!, storageID));
	}, [chat, rid, tmid]);

	const handleSendMessage = useMutableCallback(() => {
		const text = chat?.composer?.text;
		if (!text) {
			console.warn('No text to send');
			return;
		}
		onSend?.({
			value: text,
		}).then(() => {
			chat?.composer?.setText('');
		});
	});

	const handler = useComposeChainEvents(
		useStableArray([
			useMessageComposerHandleSubmit(handleSendMessage),
			useMessageComposerArrowNavigation({
				onArrowDown: onNavigateToNextMessage,
				onArrowUp: onNavigateToPreviousMessage,
				onEscape,
			}),
		]),
	);

	const { textAreaStyle, shadowStyle } = useAutoGrow(textareaRef, shadowRef);

	// TODO: Chat context should contain isEditing state
	return (
		<div className={['rc-message-box rc-new', isEmbedded && 'rc-message-box--embedded'].filter(Boolean).join(' ')}>
			<UserActionIndicator rid={rid} tmid={tmid} />
			<BlazeTemplate name='messagePopupConfig' tmid={tmid} rid={rid} getInput={() => textareaRef.current} />
			{chat?.composer?.quotedMessages && <MessageBoxReplies />}
			<div ref={shadowRef} style={shadowStyle} />
			<div className='rc-message-box__container'>
				<MessageComposerAction icon='emoji' disabled={!useEmojis} onClick={handleOpenEmojiPicker} />
				<Box
					is='textarea'
					mi='x8'
					ref={textareaRef}
					aria-label={t('Message')}
					name='msg'
					style={textAreaStyle}
					maxLength={Number.isInteger(maxLength) ? parseInt(maxLength as string) : undefined}
					placeholder={t('Message')}
					rows={1}
					className='rc-message-box__textarea js-input-message'
					onKeyDown={handler}
				/>

				<MessageComposerAction onClick={handleSendMessage} icon='send' />
				<MessageComposerAction
					onClick={(event): void => {
						const groups = messageBox.actions.get();
						const config = {
							popoverClass: 'message-box',
							columns: [
								{
									groups: Object.keys(groups).map((group) => {
										const items = groups[group].map((item) => ({
											icon: item.icon,
											name: t(item.label),
											type: 'messagebox-action',
											id: item.id,
										}));
										return {
											title: t(group),
											items,
										};
									}),
								},
							],
							offsetVertical: 10,
							direction: 'top-inverted',
							currentTarget: event.currentTarget,
							data: {
								rid,
								tmid,
								prid: subscription?.prid,
								messageBox: textareaRef.current,
								chat,
							},
							activeElement: event.currentTarget,
						};

						popover.open(config);
					}}
					icon='plus'
				/>
			</div>

			{showFormattingTips && (
				<div className='rc-message-box__toolbar-formatting'>
					{formattingButtons
						.filter(({ condition }) => !condition || condition())
						.map(({ icon, link, text, label, pattern }) =>
							icon ? (
								<button
									key={label}
									className='rc-message-box__toolbar-formatting-item js-format'
									data-id={label}
									title={label}
									onClick={(): void => {
										textareaRef.current && pattern && applyFormatting(pattern, textareaRef.current);
									}}
								>
									<svg
										className={`rc-icon rc-message-box__toolbar-formatting-icon rc-message-box__toolbar-formatting-icon--${icon}`}
										aria-hidden='true'
									>
										<use xlinkHref={`#icon-${icon}`} />
									</svg>
								</button>
							) : (
								<span className='rc-message-box__toolbar-formatting-item' title={label}>
									<a href={link} target='_blank' rel='noopener noreferrer' className='rc-message-box__toolbar-formatting-link'>
										{text}
									</a>
								</span>
							),
						)}
				</div>
			)}
		</div>
	);
};

export default memo(MessageBox);
