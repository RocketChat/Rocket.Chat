/* eslint-disable complexity */
import { isRoomFederated, isRoomNativeFederated, type IMessage, type ISubscription } from '@rocket.chat/core-typings';
import { useContentBoxSize, useEffectEvent, useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import {
	MessageComposerAction,
	MessageComposerToolbarActions,
	MessageComposer,
	MessageComposerToolbar,
	MessageComposerActionsDivider,
	MessageComposerToolbarSubmit,
	MessageComposerButton,
	MessageComposerInputExpandable,
} from '@rocket.chat/ui-composer';
import { useTranslation, useUserPreference, useLayout, useSetting } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement, FormEvent, MouseEvent, ClipboardEvent } from 'react';
import { memo, useRef, useReducer, useCallback, useSyncExternalStore } from 'react';

import MessageBoxActionsToolbar from './MessageBoxActionsToolbar';
import MessageBoxFormattingToolbar from './MessageBoxFormattingToolbar';
import MessageBoxHint from './MessageBoxHint';
import MessageBoxReplies from './MessageBoxReplies';
import { createComposerAPI } from '../../../../../app/ui-message/client/messageBox/createComposerAPI';
import type { FormattingButton } from '../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { formattingButtons } from '../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { getImageExtensionFromMime } from '../../../../../lib/getImageExtensionFromMime';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import type { ComposerAPI } from '../../../../lib/chats/ChatAPI';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { keyCodes } from '../../../../lib/utils/keyCodes';
import AudioMessageRecorder from '../../../composer/AudioMessageRecorder';
import VideoMessageRecorder from '../../../composer/VideoMessageRecorder';
import { useChat } from '../../contexts/ChatContext';
import { useComposerPopupOptions } from '../../contexts/ComposerPopupContext';
import { useRoom } from '../../contexts/RoomContext';
import ComposerBoxPopup from '../ComposerBoxPopup';
import ComposerBoxPopupPreview from '../ComposerBoxPopupPreview';
import ComposerUserActionIndicator from '../ComposerUserActionIndicator';
import { useAutoGrow } from '../RoomComposer/hooks/useAutoGrow';
import { useComposerBoxPopup } from '../hooks/useComposerBoxPopup';
import { useEnablePopupPreview } from '../hooks/useEnablePopupPreview';
import { useMessageComposerMergedRefs } from '../hooks/useMessageComposerMergedRefs';
import { useMessageBoxAutoFocus } from './hooks/useMessageBoxAutoFocus';
import { useMessageBoxPlaceholder } from './hooks/useMessageBoxPlaceholder';
import { useIsFederationEnabled } from '../../../../hooks/useIsFederationEnabled';

const reducer = (_: unknown, event: FormEvent<HTMLInputElement>): boolean => {
	const target = event.target as HTMLInputElement;

	return Boolean(target.value.trim());
};

const handleFormattingShortcut = (event: KeyboardEvent, formattingButtons: FormattingButton[], composer: ComposerAPI) => {
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

const handleOrderedList = (event: KeyboardEvent, composer: ComposerAPI) => {
	const input = event.target as HTMLTextAreaElement;
	const { value, selectionStart, selectionEnd } = input;

	// Check if the user just typed a space
	if (event.key !== ' ') {
		return false;
	}

	// Check if there's text before the cursor
	if (selectionStart < 2) {
		return false;
	}

	// Get the text before the cursor
	const textBeforeCursor = value.substring(0, selectionStart);

	// Check if the text matches the pattern: number followed by a period at the beginning of a line
	const match = /(?:^|\n)(\d+)\.$/.exec(textBeforeCursor);

	if (!match) {
		return false;
	}

	// Get the number that was typed
	const number = match[1];
	// Get the position where the number starts
	const startPos = match.index;

	// Replace the "number." with a non-editable format by adding a space before
	// "1." becomes " 1." to indicate it's part of a list formatting
	const newText = textBeforeCursor.substring(0, startPos) + textBeforeCursor.substring(startPos).replace(`${number}.`, ` ${number}. `);

	// Set the new text
	composer.setText(newText + value.substring(selectionEnd));

	// Set the cursor position after the added spaces (2 spaces added)
	const newCursorPos = selectionStart + 2;
	setTimeout(() => {
		input.focus();
		input.setSelectionRange(newCursorPos, newCursorPos);
	}, 0);

	return true;
};

const emptySubscribe = () => () => undefined;
const getEmptyFalse = () => false;
const a: any[] = [];
const getEmptyArray = () => a;

type MessageBoxProps = {
	tmid?: IMessage['_id'];
	onSend?: (params: { value: string; tshow?: boolean; previewUrls?: string[]; isSlashCommandAllowed?: boolean }) => Promise<void>;
	onJoin?: () => Promise<void>;
	onResize?: () => void;
	onTyping?: () => void;
	onEscape?: () => void;
	onNavigateToPreviousMessage?: () => void;
	onNavigateToNextMessage?: () => void;
	onUploadFiles?: (files: readonly File[]) => void;
	tshow?: IMessage['tshow'];
	previewUrls?: string[];
	subscription?: ISubscription;
	showFormattingTips: boolean;
	isEmbedded?: boolean;
};

const MessageBox = ({
	tmid,
	onSend,
	onJoin,
	onNavigateToNextMessage,
	onNavigateToPreviousMessage,
	onUploadFiles,
	onEscape,
	onTyping,
	tshow,
	previewUrls,
}: MessageBoxProps): ReactElement => {
	const chat = useChat();
	const room = useRoom();
	const t = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable', false);
	const unencryptedMessagesAllowed = useSetting('E2E_Allow_Unencrypted_Messages', false);
	const isSlashCommandAllowed = !e2eEnabled || !room.encrypted || unencryptedMessagesAllowed;
	const composerPlaceholder = useMessageBoxPlaceholder(t('Message'), room);
	const quoteChainLimit = useSetting('Message_QuoteChainLimit', 2);
	const [typing, setTyping] = useReducer(reducer, false);

	const { isMobile } = useLayout();
	const sendOnEnterBehavior = useUserPreference<'normal' | 'alternative' | 'desktop'>('sendOnEnter') || isMobile;
	const sendOnEnter = sendOnEnterBehavior == null || sendOnEnterBehavior === 'normal' || (sendOnEnterBehavior === 'desktop' && !isMobile);

	if (!chat) {
		throw new Error('Chat context not found');
	}

	const textareaRef = useRef(null);
	const messageComposerRef = useRef<HTMLElement>(null);

	const storageID = `messagebox_${room._id}${tmid ? `-${tmid}` : ''}`;

	const callbackRef = useCallback(
		(node: HTMLTextAreaElement) => {
			if (node === null && chat.composer) {
				return chat.setComposerAPI();
			}

			if (chat.composer) {
				return;
			}
			chat.setComposerAPI(createComposerAPI(node, storageID, quoteChainLimit, messageComposerRef));
		},
		[chat, storageID, quoteChainLimit],
	);

	const autofocusRef = useMessageBoxAutoFocus(!isMobile);

	const useEmojis = useUserPreference<boolean>('useEmojis');

	const handleOpenEmojiPicker = useEffectEvent((e: MouseEvent<HTMLElement>) => {
		e.stopPropagation();
		e.preventDefault();

		if (!useEmojis) {
			return;
		}

		const ref = messageComposerRef.current as HTMLElement;
		chat.emojiPicker.open(ref, (emoji: string) => chat.composer?.insertText(` :${emoji}: `));
	});

	const handleSendMessage = useEffectEvent(() => {
		const text = chat.composer?.text ?? '';
		chat.composer?.clear();
		popup.clear();

		onSend?.({
			value: text,
			tshow,
			previewUrls,
			isSlashCommandAllowed,
		});
	});

	const closeEditing = (event: KeyboardEvent | MouseEvent<HTMLElement>) => {
		const mid = chat.currentEditingMessage.getMID();
		if (mid) {
			event.preventDefault();
			event.stopPropagation();

			chat.currentEditingMessage.reset().then((reset) => {
				if (!reset) {
					chat.currentEditingMessage.cancel();
					chat.currentEditingMessage.stop();
				}
			});
		}
	};

	const keyboardEventHandler = useEffectEvent((event: KeyboardEvent) => {
		const { which: keyCode } = event;

		const input = event.target as HTMLTextAreaElement;
		const { value } = input;

		// Add handling for ordered list (when space is pressed)
		if (chat.composer && event.key === ' ') {
			if (handleOrderedList(event, chat.composer)) {
				return;
			}
		}

		const isSubmitKey = keyCode === keyCodes.CARRIAGE_RETURN || keyCode === keyCodes.NEW_LINE;

		if (isSubmitKey) {
			const withModifier = event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
			const isSending = (sendOnEnter && !withModifier) || (!sendOnEnter && withModifier);

			// Handle Shift+Enter to exit from ordered list
			if (event.shiftKey && !isSending && chat.composer) {
				const cursorPosition = input.selectionStart;
				const textBeforeCursor = value.substring(0, cursorPosition);

				// Check if we're at the end of an empty list item
				const emptyListItemMatch = /(?:^|\n) (\d+)\. $/.exec(textBeforeCursor);

				if (emptyListItemMatch) {
					// Remove the empty list item and insert a regular new line
					const matchStart = emptyListItemMatch.index;
					const newText = textBeforeCursor.substring(0, matchStart) + (matchStart > 0 ? '\n' : ''); // Only add a newline if not at the start

					chat.composer.setText(newText + value.substring(cursorPosition));

					setTimeout(() => {
						input.focus();
						input.setSelectionRange(newText.length, newText.length);
					}, 0);

					event.preventDefault();
					return false;
				}
			}

			event.preventDefault();
			if (!isSending) {
				chat.composer?.insertNewLine();

				// Add auto-incrementing number for ordered lists
				const cursorPosition = input.selectionStart;
				const textBeforeCursor = value.substring(0, cursorPosition);

				// Check if we're in an ordered list by looking at the previous line
				// Updated regex to match our new format with a space before the number
				const lastLineMatch = /(?:^|\n) (\d+)\. (.+)$/.exec(textBeforeCursor);

				if (lastLineMatch) {
					const lastNumber = parseInt(lastLineMatch[1], 10);
					const nextNumber = lastNumber + 1;

					// Insert the next number in the ordered list with the proper space prefixing
					chat.composer?.insertText(` ${nextNumber}. `);

					return false;
				}

				// Scroll to the new line if the message box is at max height
				if (input.scrollHeight > input.clientHeight) {
					input.scrollTop = input.scrollHeight; // Scroll to the bottom
				}
				return false;
			}
			handleSendMessage();
			return false;
		}

		if (chat.composer && handleFormattingShortcut(event, [...formattingButtons], chat.composer)) {
			return;
		}

		if (event.shiftKey || event.ctrlKey || event.metaKey) {
			return;
		}

		switch (event.key) {
			case 'Escape': {
				closeEditing(event);
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

	const isEditing = useSyncExternalStore(chat.composer?.editing.subscribe ?? emptySubscribe, chat.composer?.editing.get ?? getEmptyFalse);

	const isRecordingAudio = useSyncExternalStore(
		chat.composer?.recording.subscribe ?? emptySubscribe,
		chat.composer?.recording.get ?? getEmptyFalse,
	);

	const isMicrophoneDenied = useSyncExternalStore(
		chat.composer?.isMicrophoneDenied.subscribe ?? emptySubscribe,
		chat.composer?.isMicrophoneDenied.get ?? getEmptyFalse,
	);

	const isRecordingVideo = useSyncExternalStore(
		chat.composer?.recordingVideo.subscribe ?? emptySubscribe,
		chat.composer?.recordingVideo.get ?? getEmptyFalse,
	);

	const formatters = useSyncExternalStore(
		chat.composer?.formatters.subscribe ?? emptySubscribe,
		chat.composer?.formatters.get ?? getEmptyArray,
	);

	const isRecording = isRecordingAudio || isRecordingVideo;

	const { autoGrowRef, textAreaStyle } = useAutoGrow(textareaRef, isRecordingAudio);

	const federationMatrixEnabled = useIsFederationEnabled();

	const canSend = useReactiveValue(
		useCallback(() => {
			if (!room.t) {
				return false;
			}

			if (!roomCoordinator.getRoomDirectives(room.t).canSendMessage(room)) {
				return false;
			}

			if (isRoomFederated(room)) {
				// we are dropping the non native federation for now
				if (!isRoomNativeFederated(room)) {
					return false;
				}

				return federationMatrixEnabled;
			}
			return true;
		}, [room, federationMatrixEnabled]),
	);

	const sizes = useContentBoxSize(textareaRef);

	const format = useFormatDateAndTime();

	const joinMutation = useMutation({
		mutationFn: async () => onJoin?.(),
	});

	const handlePaste = useEffectEvent((event: ClipboardEvent<HTMLTextAreaElement>) => {
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

	const popupOptions = useComposerPopupOptions();
	const popup = useComposerBoxPopup(popupOptions);

	const keyDownHandlerCallbackRef = useSafeRefCallback(
		useCallback(
			(node: HTMLTextAreaElement) => {
				const eventHandler = (e: KeyboardEvent) => keyboardEventHandler(e);
				node.addEventListener('keydown', eventHandler);

				return () => {
					node.removeEventListener('keydown', eventHandler);
				};
			},
			[keyboardEventHandler],
		),
	);

	const mergedRefs = useMessageComposerMergedRefs(
		popup.callbackRef,
		textareaRef,
		autoGrowRef,
		callbackRef,
		autofocusRef,
		keyDownHandlerCallbackRef,
	);

	const shouldPopupPreview = useEnablePopupPreview(popup.filter, popup.option);

	return (
		<>
			{chat.composer?.quotedMessages && <MessageBoxReplies />}
			{shouldPopupPreview && popup.option && (
				<ComposerBoxPopup
					select={popup.select}
					items={popup.items}
					focused={popup.focused}
					title={popup.option.title}
					renderItem={popup.option.renderItem}
				/>
			)}
			{/*
				SlashCommand Preview popup works in a weird way
				There is only one trigger for all the commands: "/"
				After that we need to the slashcommand list and check if the command exists and provide the preview
				if not the query is `suspend` which means the slashcommand is not found or doesn't have a preview
			*/}
			{popup.option?.preview && (
				<ComposerBoxPopupPreview
					select={popup.select}
					items={popup.items as any}
					focused={popup.focused as any}
					title={popup.option.title}
					renderItem={popup.option.renderItem}
					ref={popup.commandsRef}
					rid={room._id}
					tmid={tmid}
					suspended={popup.suspended}
				/>
			)}
			<MessageBoxHint
				isEditing={isEditing}
				e2eEnabled={e2eEnabled}
				unencryptedMessagesAllowed={unencryptedMessagesAllowed}
				isMobile={isMobile}
			/>
			{isRecordingVideo && <VideoMessageRecorder reference={messageComposerRef} rid={room._id} tmid={tmid} />}
			<MessageComposer ref={messageComposerRef} variant={isEditing ? 'editing' : undefined}>
				{isRecordingAudio && <AudioMessageRecorder rid={room._id} isMicrophoneDenied={isMicrophoneDenied} />}
				<MessageComposerInputExpandable
					dimensions={sizes}
					ref={mergedRefs}
					aria-label={composerPlaceholder}
					name='msg'
					disabled={isRecording || !canSend}
					onChange={setTyping}
					style={textAreaStyle}
					placeholder={composerPlaceholder}
					onPaste={handlePaste}
					aria-activedescendant={popup.focused ? `popup-item-${popup.focused._id}` : undefined}
				/>
				<MessageComposerToolbar>
					<MessageComposerToolbarActions aria-label={t('Message_composer_toolbox_primary_actions')}>
						<MessageComposerAction
							icon='emoji'
							disabled={!useEmojis || isRecording || !canSend}
							onClick={handleOpenEmojiPicker}
							title={t('Emoji')}
						/>
						<MessageComposerActionsDivider />
						{chat.composer && formatters.length > 0 && (
							<MessageBoxFormattingToolbar
								composer={chat.composer}
								variant={sizes.inlineSize < 480 ? 'small' : 'large'}
								items={formatters}
								disabled={isRecording || !canSend}
							/>
						)}
						<MessageBoxActionsToolbar
							canSend={canSend}
							typing={typing}
							isMicrophoneDenied={isMicrophoneDenied}
							rid={room._id}
							tmid={tmid}
							isRecording={isRecording}
							variant={sizes.inlineSize < 480 ? 'small' : 'large'}
						/>
					</MessageComposerToolbarActions>
					<MessageComposerToolbarSubmit>
						{!canSend && (
							<MessageComposerButton primary onClick={onJoin} loading={joinMutation.isPending}>
								{t('Join')}
							</MessageComposerButton>
						)}
						{canSend && (
							<>
								{isEditing && <MessageComposerButton onClick={closeEditing}>{t('Cancel')}</MessageComposerButton>}
								<MessageComposerAction
									aria-label={t('Send')}
									icon='send'
									disabled={!canSend || (!typing && !isEditing)}
									onClick={handleSendMessage}
									secondary={typing || isEditing}
									info={typing || isEditing}
								/>
							</>
						)}
					</MessageComposerToolbarSubmit>
				</MessageComposerToolbar>
			</MessageComposer>
			<ComposerUserActionIndicator rid={room._id} tmid={tmid} />
		</>
	);
};

export default memo(MessageBox);
