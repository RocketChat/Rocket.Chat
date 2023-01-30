import { Button, Tag, Box } from '@rocket.chat/fuselage';
import { useContentBoxSize, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	MessageComposerAction,
	MessageComposerToolbarActions,
	MessageComposer,
	MessageComposerInput,
	MessageComposerToolbar,
	MessageComposerActionsDivider,
	MessageComposerToolbarSubmit,
} from '@rocket.chat/ui-composer';
import { useTranslation, useUserPreference, useLayout } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type {
	MouseEventHandler,
	ReactElement,
	FormEvent,
	KeyboardEventHandler,
	KeyboardEvent,
	MutableRefObject,
	Ref,
	ClipboardEventHandler,
} from 'react';
import React, { memo, useRef, useReducer, useCallback } from 'react';
import { useSubscription } from 'use-subscription';

import { EmojiPicker } from '../../../../../../../app/emoji/client';
import { createComposerAPI } from '../../../../../../../app/ui-message/client/messageBox/createComposerAPI';
import type { MessageBoxTemplateInstance } from '../../../../../../../app/ui-message/client/messageBox/messageBox';
import type { FormattingButton } from '../../../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { formattingButtons } from '../../../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { messageBox, popover } from '../../../../../../../app/ui-utils/client';
import { getImageExtensionFromMime } from '../../../../../../../lib/getImageExtensionFromMime';
import { useFormatDateAndTime } from '../../../../../../hooks/useFormatDateAndTime';
import { useReactiveValue } from '../../../../../../hooks/useReactiveValue';
import type { ComposerAPI } from '../../../../../../lib/chats/ChatAPI';
import { roomCoordinator } from '../../../../../../lib/rooms/roomCoordinator';
import { keyCodes } from '../../../../../../lib/utils/keyCodes';
import AudioMessageRecorder from '../../../../../composer/AudioMessageRecorder';
import VideoMessageRecorder from '../../../../../composer/VideoMessageRecorder';
import { useChat } from '../../../../contexts/ChatContext';
import BlazeTemplate from '../../../BlazeTemplate';
import ComposerUserActionIndicator from '../ComposerUserActionIndicator';
import { useAutoGrow } from '../RoomComposer/hooks/useAutoGrow';
import MessageBoxFormattingToolbar from './MessageBoxFormattingToolbar';
import MessageBoxReplies from './MessageBoxReplies';

const reducer = (_: unknown, event: FormEvent<HTMLInputElement>): boolean => {
	const target = event.target as HTMLInputElement;

	return Boolean(target.value.trim());
};

const handleFormattingShortcut = (
	event: KeyboardEvent<HTMLTextAreaElement>,
	formattingButtons: FormattingButton[],
	composer: ComposerAPI,
) => {
	const isMacOS = navigator.platform.indexOf('Mac') !== -1;
	const isCmdOrCtrlPressed = (isMacOS && event.metaKey) || (!isMacOS && event.ctrlKey);

	if (!isCmdOrCtrlPressed) {
		return false;
	}

	const key = event.key.toLowerCase();

	const formatter = formattingButtons.find((formatter) => 'command' in formatter && formatter.command === key);

	if (!formatter || !('pattern' in formatter)) {
		return false;
	}

	composer.wrapSelection(formatter.pattern);
	return true;
};

const emptySubscribe = () => () => undefined;
const getEmptyFalse = () => false;
const a: any[] = [];
const getEmptyArray = () => a;

type MessageBoxProps = Omit<MessageBoxTemplateInstance['data'], 'chatContext'>;

const MessageBox = ({
	rid,
	tmid,
	onSend,
	onJoin,
	onNavigateToNextMessage,
	onNavigateToPreviousMessage,
	onUploadFiles,
	onEscape,
	onTyping,
	subscription,
	readOnly,
	tshow,
}: MessageBoxProps): ReactElement => {
	const [typing, setTyping] = useReducer(reducer, false);

	const { isMobile } = useLayout();
	const sendOnEnterBehavior = useUserPreference<'normal' | 'alternative' | 'desktop'>('sendOnEnter') || isMobile;
	const sendOnEnter = sendOnEnterBehavior == null || sendOnEnterBehavior === 'normal' || (sendOnEnterBehavior === 'desktop' && !isMobile);

	const t = useTranslation();

	const chat = useChat();

	if (!chat) {
		throw new Error('Chat context not found');
	}

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const messageComposerRef = useRef<HTMLElement>(null);
	const shadowRef = useRef(null);

	const callbackRef = useCallback(
		(node: HTMLTextAreaElement) => {
			const storageID = `${rid}${tmid ? `-${tmid}` : ''}`;
			chat.composer?.release();
			if (node === null) {
				return;
			}
			chat.setComposerAPI(createComposerAPI(node, storageID));
			(textareaRef as MutableRefObject<HTMLTextAreaElement>).current = node;
		},
		[chat, rid, tmid],
	);

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

		EmojiPicker.open(e.currentTarget, (emoji: string) => chat?.composer?.insertText(`:${emoji}: `));
	});

	const handleSendMessage = useMutableCallback(() => {
		const text = chat?.composer?.text ?? '';
		chat?.composer?.clear();

		onSend?.({
			value: text,
			tshow,
		});
	});

	const handler: KeyboardEventHandler<HTMLTextAreaElement> = useMutableCallback((event) => {
		const { which: keyCode } = event;

		const input = event.target as HTMLTextAreaElement;

		const isSubmitKey = keyCode === keyCodes.CARRIAGE_RETURN || keyCode === keyCodes.NEW_LINE;

		if (isSubmitKey) {
			const withModifier = event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
			const isSending = (sendOnEnter && !withModifier) || (!sendOnEnter && withModifier);

			event.preventDefault();
			if (!isSending) {
				chat?.composer?.insertNewLine();
				return false;
			}
			handleSendMessage();
			return false;
		}

		if (chat?.composer && handleFormattingShortcut(event, [...formattingButtons], chat?.composer)) {
			return;
		}

		if (event.shiftKey || event.ctrlKey || event.metaKey) {
			return;
		}

		switch (event.key) {
			case 'Escape': {
				if (chat?.currentEditing) {
					event.preventDefault();
					event.stopPropagation();

					chat?.currentEditing.reset().then((reset) => {
						if (!reset) {
							chat?.currentEditing?.cancel();
						}
					});

					return;
				}

				if (!input.value.trim()) onEscape?.();
				return;
			}

			case 'ArrowUp': {
				if (input.selectionEnd === 0) {
					event.preventDefault();
					event.stopPropagation();

					onNavigateToPreviousMessage?.();

					if (event.altKey) {
						input.setSelectionRange(0, 0);
					}
				}

				return;
			}

			case 'ArrowDown': {
				if (input.selectionEnd === input.value.length) {
					event.preventDefault();
					event.stopPropagation();

					onNavigateToNextMessage?.();

					if (event.altKey) {
						input.setSelectionRange(input.value.length, input.value.length);
					}
				}
			}
		}

		onTyping?.();
	});

	const isEditing = useSubscription({
		getCurrentValue: chat.composer?.editing.get ?? getEmptyFalse,
		subscribe: chat.composer?.editing.subscribe ?? emptySubscribe,
	});

	const isRecording = useSubscription({
		getCurrentValue: chat.composer?.recording.get ?? getEmptyFalse,
		subscribe: chat.composer?.recording.subscribe ?? emptySubscribe,
	});

	const isRecordingVideo = useSubscription({
		getCurrentValue: chat.composer?.recordingVideo.get ?? getEmptyFalse,
		subscribe: chat.composer?.recordingVideo.subscribe ?? emptySubscribe,
	});

	const formatters = useSubscription({
		getCurrentValue: chat.composer?.formatters.get ?? getEmptyArray,
		subscribe: chat.composer?.formatters.subscribe ?? emptySubscribe,
	});

	const { textAreaStyle, shadowStyle } = useAutoGrow(textareaRef, shadowRef);

	const canSend = useReactiveValue(useCallback(() => roomCoordinator.verifyCanSendMessage(rid), [rid]));

	const sizes = useContentBoxSize(textareaRef);

	const format = useFormatDateAndTime();

	const joinMutation = useMutation(async () => onJoin?.());

	const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = useMutableCallback((event) => {
		const { clipboardData } = event;

		if (!clipboardData) {
			return;
		}

		const items = Array.from(clipboardData.items);

		if (items.some(({ kind, type }) => kind === 'string' && type === 'text/plain')) {
			return;
		}

		const files = items
			.filter((item) => item.kind === 'file' && item.type.indexOf('image/') !== -1)
			.map((item) => {
				const fileItem = item.getAsFile();

				if (!fileItem) {
					return;
				}

				const imageExtension = fileItem ? getImageExtensionFromMime(fileItem.type) : undefined;

				const extension = imageExtension ? `.${imageExtension}` : '';

				Object.defineProperty(fileItem, 'name', {
					writable: true,
					value: `Clipboard - ${format(new Date())}${extension}`,
				});
				return fileItem;
			})
			.filter((file): file is File => !!file);

		if (files.length) {
			event.preventDefault();
			onUploadFiles?.(files);
		}
	});

	return (
		<>
			{chat?.composer?.quotedMessages && <MessageBoxReplies />}
			<BlazeTemplate w='full' name='messagePopupConfig' tmid={tmid} rid={rid} getInput={() => textareaRef.current} />
			<BlazeTemplate w='full' name='messagePopupSlashCommandPreview' tmid={tmid} rid={rid} getInput={() => textareaRef.current} />
			{readOnly && (
				<Box mbe='x4'>
					<Tag title={t('Only_people_with_permission_can_send_messages_here')}>{t('This_room_is_read_only')}</Tag>
				</Box>
			)}
			{isRecordingVideo && <VideoMessageRecorder reference={messageComposerRef} rid={rid} tmid={tmid} />}
			<MessageComposer ref={messageComposerRef} variant={isEditing ? 'editing' : undefined}>
				<MessageComposerInput
					ref={callbackRef as unknown as Ref<HTMLInputElement>}
					aria-label={t('Message')}
					name='msg'
					disabled={isRecording}
					onChange={setTyping}
					style={textAreaStyle}
					placeholder={t('Message')}
					className='rc-message-box__textarea js-input-message'
					onKeyDown={handler}
					onPaste={handlePaste}
				/>
				<div ref={shadowRef} style={shadowStyle} />
				<MessageComposerToolbar>
					<MessageComposerToolbarActions aria-label={t('Message_composer_toolbox_primary_actions')}>
						<MessageComposerAction icon='emoji' disabled={!useEmojis || isRecording} onClick={handleOpenEmojiPicker} title={t('Emoji')} />
						<MessageComposerActionsDivider />
						{chat.composer && formatters.length > 0 && (
							<MessageBoxFormattingToolbar
								composer={chat.composer}
								variant={sizes.inlineSize < 480 ? 'small' : 'large'}
								items={formatters}
								disabled={isRecording}
							/>
						)}
						<MessageComposerActionsDivider />
						<AudioMessageRecorder rid={rid} tmid={tmid} disabled={!canSend || typing} />
						<MessageComposerAction
							disabled={isRecording}
							onClick={(event): void => {
								const groups = messageBox.actions.get();
								const config = {
									popoverClass: 'message-box',
									columns: [
										{
											groups: Object.entries(groups).map(([name, group]) => {
												const items = group.map((item) => ({
													icon: item.icon,
													name: t(item.label),
													type: 'messagebox-action',
													id: item.id,
													action: item.action,
												}));
												return {
													title: t.has(name) && t(name),
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
							data-qa-id='menu-more-actions'
						/>
					</MessageComposerToolbarActions>
					<MessageComposerToolbarSubmit>
						{!canSend && (
							<Button small primary onClick={onJoin} disabled={joinMutation.isLoading}>
								{t('Join')}
							</Button>
						)}
						{canSend && (
							<MessageComposerAction
								aria-label={t('Send')}
								icon='send'
								disabled={!canSend || (!typing && !isEditing)}
								onClick={handleSendMessage}
								secondary={typing || isEditing}
								info={typing || isEditing}
							/>
						)}
					</MessageComposerToolbarSubmit>
				</MessageComposerToolbar>
			</MessageComposer>
			<ComposerUserActionIndicator rid={rid} tmid={tmid} />
		</>
	);
};

export default memo(MessageBox);
