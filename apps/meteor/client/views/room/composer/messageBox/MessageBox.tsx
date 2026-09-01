/* eslint-disable complexity */
import { isRoomFederated, isRoomNativeFederated, type IMessage, type ISubscription } from '@rocket.chat/core-typings';
import { useContentBoxSize, useStableCallback, useMediaQuery, useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import { MessageComposerInputExpandable } from '@rocket.chat/ui-composer';
import { useTranslation, useUserPreference, useLayout, useSetting } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { MouseEvent, ClipboardEvent, ChangeEvent } from 'react';
import { memo, useRef, useReducer, useCallback, useSyncExternalStore } from 'react';

import MessageBoxBase from './MessageBoxBase';
import MessageComposerFiles from './MessageComposerFiles';
import { createComposerAPI } from './createComposerAPI';
import { useDraft } from './hooks/useDraft';
import { useMessageBoxAutoFocus } from './hooks/useMessageBoxAutoFocus';
import { useMessageBoxPlaceholder } from './hooks/useMessageBoxPlaceholder';
import { emptySubscribe, getEmptyFalse, getEmptyArray, handleFormattingShortcut } from './messageBoxHelpers';
import { handleSelectionWrapping } from './wrapSelection';
import { getImageExtensionFromMime } from '../../../../../lib/getImageExtensionFromMime';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { useIsFederationEnabled } from '../../../../hooks/useIsFederationEnabled';
import { emoji } from '../../../../lib/emoji';
import { formattingButtons } from '../../../../lib/messageBoxFormatting';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { keyCodes } from '../../../../lib/utils/keyCodes';
import { Subscriptions } from '../../../../stores';
import { useFileUpload } from '../../body/hooks/useFileUpload';
import { useChat } from '../../contexts/ChatContext';
import { useComposerPopupOptions } from '../../contexts/ComposerPopupContext';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useAutoGrow } from '../RoomComposer/hooks/useAutoGrow';
import { useComposerBoxPopup } from '../hooks/useComposerBoxPopup';
import { useEnablePopupPreview } from '../hooks/useEnablePopupPreview';
import { useMessageComposerMergedRefs } from '../hooks/useMessageComposerMergedRefs';

const reducer = (_: unknown, event: ChangeEvent<HTMLInputElement>): boolean => {
	const { target } = event;

	return Boolean(target.value.trim());
};

export type MessageBoxProps = {
	tmid?: IMessage['_id'];
	onSend?: (params: { value: string; tshow?: boolean; previewUrls?: string[]; isSlashCommandAllowed?: boolean }) => Promise<void>;
	onJoin?: () => Promise<void>;
	onResize?: () => void;
	onTyping?: () => void;
	onEscape?: () => void;
	onNavigateToPreviousMessage?: () => void;
	onNavigateToNextMessage?: () => void;
	tshow?: IMessage['tshow'];
	previewUrls?: string[];
	subscription?: ISubscription;
	showFormattingTips: boolean;
	isEmbedded?: boolean;
	threadExists?: boolean;
};

const MessageBox = ({
	tmid,
	onSend,
	onJoin,
	onNavigateToNextMessage,
	onNavigateToPreviousMessage,
	onEscape,
	onTyping,
	tshow,
	previewUrls,
	threadExists,
}: MessageBoxProps) => {
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

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const messageComposerRef = useRef<HTMLElement>(null);

	const subscription = useRoomSubscription();
	const { initialValue, persistLocal, flushDraft } = useDraft(
		room._id,
		tmid ? subscription?.threadDrafts?.[tmid] : subscription?.draft,
		tmid,
		threadExists,
	);

	const callbackRef = useCallback(
		(node: HTMLTextAreaElement) => {
			if (node === null && chat.composer) {
				flushDraft();
				return chat.setComposerAPI();
			}

			if (chat.composer) {
				return;
			}
			chat.setComposerAPI(
				createComposerAPI(node, persistLocal, initialValue, quoteChainLimit, messageComposerRef, { rid: room._id, tmid }),
			);
		},
		[chat, flushDraft, initialValue, persistLocal, quoteChainLimit, room._id, tmid],
	);

	const isTouchDevice = useMediaQuery('(pointer: coarse)');
	const autofocusRef = useMessageBoxAutoFocus(!isTouchDevice);

	const useEmojis = useUserPreference<boolean>('useEmojis');

	const handleOpenEmojiPicker = useStableCallback((e: MouseEvent<HTMLElement>) => {
		e.stopPropagation();
		e.preventDefault();

		if (!useEmojis) {
			return;
		}

		const ref = messageComposerRef.current as HTMLElement;
		chat.emojiPicker.open(ref, (emojiName: string) => {
			const emojiEntry = emoji.list[`:${emojiName}:`];
			const text = emojiEntry && 'unicode' in emojiEntry && emojiEntry.unicode ? ` ${emojiEntry.unicode} ` : ` :${emojiName}: `;
			chat.composer?.insertText(text);
		});
	});

	const { hasUploads, handleUploadFiles, isUploading, isProcessingUploads } = useFileUpload();

	const handleSendMessage = useStableCallback(() => {
		if (isUploading || isProcessingUploads) {
			return;
		}

		const text = chat.composer?.text ?? '';
		popup.clear();

		onSend?.({
			value: text,
			tshow,
			previewUrls,
			isSlashCommandAllowed,
		});
	});

	const closeEditing = async (event: KeyboardEvent | MouseEvent<HTMLElement>) => {
		const mid = chat.currentEditingMessage.getMID();
		if (mid) {
			event.preventDefault();
			event.stopPropagation();

			// NOTE: if the message was reset (i.e. content changed), we keep the editing mode on
			const reset = await chat.currentEditingMessage.reset();

			if (!reset) {
				await chat.currentEditingMessage.cancel();
				await chat.currentEditingMessage.stop();
			}

			popup.clear();
		}
	};

	const keyboardEventHandler = useStableCallback((event: KeyboardEvent) => {
		const { which: keyCode } = event;

		const input = event.target as HTMLTextAreaElement;

		const isSubmitKey = keyCode === keyCodes.CARRIAGE_RETURN || keyCode === keyCodes.NEW_LINE;

		if (isSubmitKey) {
			const withModifier = event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;
			const isSending = (sendOnEnter && !withModifier) || (!sendOnEnter && withModifier);

			event.preventDefault();
			if (!isSending) {
				chat.composer?.insertNewLine();
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

	// canSendMessage directives read from the Subscriptions store, so subscribe to it to re-run on changes
	// (e.g. user joins/leaves the room). room and federationMatrixEnabled are already React-reactive.
	const subscribeSubscriptions = useCallback((onStoreChange: () => void) => Subscriptions.use.subscribe(onStoreChange), []);
	const canSend = useSyncExternalStore(subscribeSubscriptions, () => {
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
	});

	const sizes = useContentBoxSize(textareaRef);

	const format = useFormatDateAndTime();

	const joinMutation = useMutation({
		mutationFn: async () => onJoin?.(),
	});

	const handlePaste = useStableCallback((event: ClipboardEvent<HTMLTextAreaElement>) => {
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
			handleUploadFiles?.(files);
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

	const beforeInputHandlerCallbackRef = useSafeRefCallback(
		useCallback(
			(node: HTMLTextAreaElement) => {
				const eventHandler = (e: Event) => handleSelectionWrapping(e as InputEvent, chat);
				node.addEventListener('beforeinput', eventHandler);

				return () => {
					node.removeEventListener('beforeinput', eventHandler);
				};
			},
			[chat],
		),
	);

	const mergedRefs = useMessageComposerMergedRefs(
		popup.callbackRef,
		textareaRef,
		autoGrowRef,
		callbackRef,
		autofocusRef,
		keyDownHandlerCallbackRef,
		beforeInputHandlerCallbackRef,
	);

	const shouldPopupPreview = useEnablePopupPreview(popup.filter, popup.option);

	return (
		<MessageBoxBase
			rid={room._id}
			tmid={tmid}
			composer={chat.composer}
			messageComposerRef={messageComposerRef}
			popup={popup}
			shouldPopupPreview={shouldPopupPreview}
			isEditing={isEditing}
			isRecording={isRecording}
			isRecordingAudio={isRecordingAudio}
			isRecordingVideo={isRecordingVideo}
			isMicrophoneDenied={isMicrophoneDenied}
			formatters={formatters}
			canSend={canSend}
			useEmojis={useEmojis}
			sendEnabled={canSend && !isUploading && !isProcessingUploads && (typing || isEditing || hasUploads)}
			sendActive={typing || isEditing || hasUploads}
			inlineSize={sizes.inlineSize}
			e2eEnabled={e2eEnabled}
			unencryptedMessagesAllowed={unencryptedMessagesAllowed}
			isMobile={isMobile}
			joinPending={joinMutation.isPending}
			onEmojiClick={handleOpenEmojiPicker}
			onSend={handleSendMessage}
			onJoin={onJoin}
			closeEditing={closeEditing}
			input={
				<MessageComposerInputExpandable
					dimensions={sizes}
					ref={mergedRefs}
					aria-label={composerPlaceholder}
					name='msg'
					disabled={isRecording || !canSend || isProcessingUploads}
					onChange={setTyping}
					style={textAreaStyle}
					placeholder={composerPlaceholder}
					onPaste={handlePaste}
					aria-activedescendant={popup.focused ? `popup-item-${popup.focused._id}` : undefined}
				/>
			}
			files={<MessageComposerFiles />}
		/>
	);
};

export default memo(MessageBox);
