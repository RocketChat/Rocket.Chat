/* eslint-disable complexity */
// TODO: CRITICAL fix the race condition between the room composer and thread composer
import { isRoomFederated, isRoomNativeFederated } from '@rocket.chat/core-typings';
import { useContentBoxSize, useMediaQuery, useSafeRefCallback, useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { Options } from '@rocket.chat/message-parser';
import { MessageComposerHint, RichTextComposerInputExpandable } from '@rocket.chat/ui-composer';
import { useTranslation, useUserPreference, useLayout, useSetting } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement, FormEvent, MouseEvent, ClipboardEvent } from 'react';
import { memo, useRef, useReducer, useCallback, useSyncExternalStore, useMemo } from 'react';

import type { MessageBoxProps } from './MessageBox';
import MessageBoxBase from './MessageBoxBase';
import MessageComposerFiles from './MessageComposerFiles';
import { useComposerHistory } from './hooks/useComposerHistory';
import { useDraft } from './hooks/useDraft';
import { useMessageBoxAutoFocus } from './hooks/useMessageBoxAutoFocus';
import { useMessageBoxPlaceholder } from './hooks/useMessageBoxPlaceholder';
import {
	emptySubscribe,
	getEmptyFalse,
	getEmptyArray,
	handleFormattingShortcut,
	extractImageFilesFromClipboard,
} from './messageBoxHelpers';
import { handleRichTextSelectionWrapping } from './wrapSelection';
import { createRichTextComposerAPI } from '../../../../../app/ui-message/client/messageBox/createRichTextComposerAPI';
import { formattingButtons } from '../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { getSelectionRange, setSelectionRange } from '../../../../../app/ui-message/client/messageBox/selectionRange';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { useIsFederationEnabled } from '../../../../hooks/useIsFederationEnabled';
import { emoji } from '../../../../lib/emoji';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { keyCodes } from '../../../../lib/utils/keyCodes';
import { Subscriptions } from '../../../../stores';
import { useAutoLinkDomains } from '../../MessageList/hooks/useAutoLinkDomains';
import { useFileUpload } from '../../body/hooks/useFileUpload';
import { useChat } from '../../contexts/ChatContext';
import { useComposerPopupOptions } from '../../contexts/ComposerPopupContext';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useComposerBoxPopup } from '../hooks/useComposerBoxPopup';
import { useEnablePopupPreview } from '../hooks/useEnablePopupPreview';
import { useMessageComposerMergedRefs } from '../hooks/useMessageComposerMergedRefs';

// The first boolean will be used to enable/disable the send button
// The second boolean will be used to show/hide the placeholder
type TypingState = {
	isTyping: boolean;
	hideplaceholder: boolean;
};

const cursorMap = new WeakMap<
	HTMLElement,
	{
		selectionStart: number;
		selectionEnd: number;
	}
>();

const reducer = (_: unknown, text: string): TypingState => ({
	isTyping: Boolean(text.trim()),
	hideplaceholder: Boolean(text),
});

const RichTextMessageBox = ({
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
}: MessageBoxProps): ReactElement => {
	const chat = useChat();
	const room = useRoom();
	const t = useTranslation();
	const e2eEnabled = useSetting('E2E_Enable', false);
	const unencryptedMessagesAllowed = useSetting('E2E_Allow_Unencrypted_Messages', false);
	const isSlashCommandAllowed = !e2eEnabled || !room.encrypted || unencryptedMessagesAllowed;
	const composerPlaceholder = useMessageBoxPlaceholder(t('Message'), room);
	const quoteChainLimit = useSetting('Message_QuoteChainLimit', 2);

	const [stateTyping, setTyping] = useReducer(reducer, { isTyping: false, hideplaceholder: false });
	const { isTyping: typing, hideplaceholder } = stateTyping;

	const { isMobile } = useLayout();
	const sendOnEnterBehavior = useUserPreference<'normal' | 'alternative' | 'desktop'>('sendOnEnter') || isMobile;
	const sendOnEnter = sendOnEnterBehavior == null || sendOnEnterBehavior === 'normal' || (sendOnEnterBehavior === 'desktop' && !isMobile);

	if (!chat) {
		throw new Error('Chat context not found');
	}

	const handleInput = useStableCallback((event: FormEvent<HTMLElement>) => {
		const target = event.target as HTMLDivElement;
		const { childNodes } = target;

		// Normalize <div><br></div> to just <br>
		if (childNodes.length === 1 && childNodes[0].nodeName === 'DIV' && (childNodes[0] as HTMLElement).innerHTML === '<br>') {
			target.innerHTML = '<br>';
		}

		// Normalize empty DOM to <br>
		if (target.innerHTML === '') {
			target.innerHTML = '<br>';
		}

		setTyping(chat.composer?.text ?? '');
	});

	const setLastCursorPosition = (e: React.FocusEvent<HTMLElement>) => {
		const node = e.currentTarget as HTMLDivElement;
		cursorMap.set(node, getSelectionRange(node));
	};

	const getLastCursorPosition = (e: React.FocusEvent<HTMLElement>) => {
		const node = e.currentTarget as HTMLDivElement;
		const savedPosition = cursorMap.get(node);
		if (savedPosition === undefined) {
			return;
		}

		setSelectionRange(node, savedPosition.selectionStart, savedPosition.selectionEnd);
	};

	const contentEditableRef = useRef<HTMLDivElement>(null);

	const messageComposerRef = useRef<HTMLElement>(null);

	const subscription = useRoomSubscription();
	const { initialValue, persistLocal, flushDraft } = useDraft(
		room._id,
		tmid ? subscription?.threadDrafts?.[tmid] : subscription?.draft,
		tmid,
		threadExists,
	);

	// Get parse options and pass it as prop to the RichTextComposer API
	// Colors and KaTeX are intentionally left out: gazzodown-alt has no renderer for those nodes,
	// so enabling them would make the typed text disappear.
	// Emoticons are left out as well: the composer keeps them as the typed text.
	const customDomains = useAutoLinkDomains();

	const parseOptions = useMemo<Options>(
		() => ({
			emoticons: false,
			customDomains,
		}),
		[customDomains],
	);

	const callbackRef = useCallback(
		(node: HTMLDivElement) => {
			if (node === null && chat.composer) {
				flushDraft();
				return chat.setComposerAPI();
			}

			if (chat.composer) {
				return;
			}
			chat.setComposerAPI(
				createRichTextComposerAPI(node, persistLocal, initialValue, quoteChainLimit, parseOptions, messageComposerRef, {
					rid: room._id,
					tmid,
				}),
			);
		},
		[chat, flushDraft, initialValue, persistLocal, quoteChainLimit, parseOptions, room._id, tmid],
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
		chat.composer?.clear();
		popup.clear();

		onSend?.({
			value: text,
			tshow,
			previewUrls,
			isSlashCommandAllowed,
		});
	});

	const closeEditing = async (event: KeyboardEvent | MouseEvent<HTMLElement>) => {
		const input = contentEditableRef.current as HTMLDivElement;
		const mid = chat.currentEditingMessage.getMID();

		if (!mid) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();

		// NOTE: if the message was reset (i.e. content changed), we keep the editing mode on
		const reset = await chat.currentEditingMessage.reset();

		if (!reset) {
			await chat.currentEditingMessage.cancel();
			await chat.currentEditingMessage.stop();
		}

		popup.clear();

		// Sets the cursor position to the end after resetting an edited message
		setSelectionRange(input, input.innerText.length, input.innerText.length);
		input.focus();
	};

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

	const federationMatrixEnabled = useIsFederationEnabled();
	const subscribeSubscriptions = useCallback((onStoreChange: () => void) => Subscriptions.use.subscribe(onStoreChange), []);
	const canSend = useSyncExternalStore(subscribeSubscriptions, () => {
		if (!room.t) {
			return false;
		}

		if (!roomCoordinator.getRoomDirectives(room.t).canSendMessage(room)) {
			return false;
		}

		if (isRoomFederated(room)) {
			if (!isRoomNativeFederated(room)) {
				return false;
			}
			return federationMatrixEnabled;
		}
		return true;
	});

	// A contenteditable ignores `disabled`, so the handlers have to bail out themselves: the browser
	// keeps firing keydown on an already-focused node after it stops being editable.
	const disabled = isRecording || !canSend || isProcessingUploads;

	const keyboardEventHandler = useStableCallback((event: KeyboardEvent) => {
		if (disabled) {
			return;
		}

		const { which: keyCode } = event;

		const input = event.target as HTMLDivElement;

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

		if (chat.composer && handleFormattingShortcut(event, [...formattingButtons], chat.composer, true)) {
			return;
		}

		if (event.shiftKey || event.ctrlKey || event.metaKey) {
			return;
		}

		switch (event.key) {
			case 'Escape': {
				closeEditing(event);
				if (!chat.composer?.text.trim()) onEscape?.();
				return;
			}

			case 'ArrowUp': {
				const { selectionEnd } = getSelectionRange(input);

				if (selectionEnd === 0) {
					event.preventDefault();
					event.stopPropagation();

					onNavigateToPreviousMessage?.();

					if (event.altKey) {
						setSelectionRange(input, 0, 0);
					}
				}

				return;
			}

			case 'ArrowDown': {
				const { selectionEnd } = getSelectionRange(input);

				const textLength = chat.composer?.text.length ?? 0;

				if (selectionEnd === textLength) {
					event.preventDefault();
					event.stopPropagation();

					onNavigateToNextMessage?.();

					if (event.altKey) {
						setSelectionRange(input, textLength, textLength);
					}
				}
			}
		}

		onTyping?.();
	});

	const newSizes = useContentBoxSize(contentEditableRef);

	const format = useFormatDateAndTime();

	const joinMutation = useMutation({
		mutationFn: async () => onJoin?.(),
	});

	const handlePaste = useStableCallback((event: ClipboardEvent<HTMLDivElement>) => {
		if (disabled) {
			event.preventDefault();
			return;
		}

		const files = extractImageFilesFromClipboard(event, format);

		if (files.length) {
			event.preventDefault();
			handleUploadFiles?.(files);
		}
	});

	const popupOptions = useComposerPopupOptions();
	const popup = useComposerBoxPopup(popupOptions);

	const keyDownHandlerCallbackRef = useSafeRefCallback(
		useCallback((node: HTMLDivElement) => {
			if (node === null) {
				return;
			}
			const eventHandler = (e: KeyboardEvent) => keyboardEventHandler(e);
			node.addEventListener('keydown', eventHandler);

			return () => {
				node.removeEventListener('keydown', eventHandler);
			};
		}, []),
	);

	const beforeInputHandlerCallbackRef = useSafeRefCallback(
		useCallback(
			(node: HTMLDivElement) => {
				if (node === null) {
					return;
				}
				const eventHandler = (e: Event) => handleRichTextSelectionWrapping(e as InputEvent, chat);
				node.addEventListener('beforeinput', eventHandler);

				return () => {
					node.removeEventListener('beforeinput', eventHandler);
				};
			},
			[chat],
		),
	);

	const composerHistoryRef = useComposerHistory(parseOptions);

	const newMergedRefs = useMessageComposerMergedRefs(
		popup.callbackRef,
		contentEditableRef,
		callbackRef,
		autofocusRef,
		keyDownHandlerCallbackRef,
		beforeInputHandlerCallbackRef,
		composerHistoryRef,
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
			inlineSize={newSizes.inlineSize}
			e2eEnabled={e2eEnabled}
			unencryptedMessagesAllowed={unencryptedMessagesAllowed}
			isMobile={isMobile}
			joinPending={joinMutation.isPending}
			onEmojiClick={handleOpenEmojiPicker}
			onSend={handleSendMessage}
			onJoin={onJoin}
			closeEditing={closeEditing}
			hint={
				<MessageComposerHint icon='flask' helperText=''>
					{t('Experiment_Realtime_message_composer')}
				</MessageComposerHint>
			}
			input={
				<RichTextComposerInputExpandable
					dimensions={newSizes}
					ref={newMergedRefs}
					aria-label={composerPlaceholder}
					name='msg'
					disabled={disabled}
					onInput={handleInput}
					placeholder={composerPlaceholder}
					hideplaceholder={hideplaceholder}
					hidetext={isRecordingAudio}
					onPaste={handlePaste}
					aria-activedescendant={popup.focused ? `popup-item-${popup.focused._id}` : undefined}
					onBlur={setLastCursorPosition}
					onFocus={getLastCursorPosition}
				/>
			}
			files={<MessageComposerFiles />}
		/>
	);
};

export default memo(RichTextMessageBox);
