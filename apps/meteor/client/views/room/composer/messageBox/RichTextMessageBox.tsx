/* eslint-disable complexity */
// TODO: CRITICAL fix the race condition between the room composer and thread composer
import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { useContentBoxSize, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSafeRefCallback } from '@rocket.chat/ui-client';
import {
	MessageComposerAction,
	MessageComposerToolbarActions,
	MessageComposer,
	/* MessageComposerInput, */
	MessageComposerToolbar,
	MessageComposerActionsDivider,
	MessageComposerToolbarSubmit,
	MessageComposerButton,
	MessageComposerHint,
	RichTextComposerInput,
} from '@rocket.chat/ui-composer';
import { useTranslation, useUserPreference, useLayout, useSetting } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement, FormEvent, MouseEvent, ClipboardEvent } from 'react';
import { memo, useRef, useReducer, useCallback, useSyncExternalStore } from 'react';

import MessageBoxActionsToolbar from './MessageBoxActionsToolbar';
import MessageBoxFormattingToolbar from './MessageBoxFormattingToolbar';
import MessageBoxHint from './MessageBoxHint';
import MessageBoxReplies from './MessageBoxReplies';
// import { createComposerAPI } from '../../../../../app/ui-message/client/messageBox/createComposerAPI';
import { useMessageBoxAutoFocus } from './hooks/useMessageBoxAutoFocus';
import { useMessageBoxPlaceholder } from './hooks/useMessageBoxPlaceholder';
import { createRichTextComposerAPI } from '../../../../../app/ui-message/client/messageBox/createRichTextComposerAPI';
import type { FormattingButton } from '../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { formattingButtons } from '../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { getSelectionRange, setSelectionRange } from '../../../../../app/ui-message/client/messageBox/selectionRange';
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
/* import { useAutoGrow } from '../RoomComposer/hooks/useAutoGrow'; */
import { useComposerBoxPopup } from '../hooks/useComposerBoxPopup';
import { useEnablePopupPreview } from '../hooks/useEnablePopupPreview';
import { useMessageComposerMergedRefs } from '../hooks/useMessageComposerMergedRefs';

const reducer = (_: unknown, event: FormEvent<HTMLDivElement>): boolean => {
	const target = event.target as HTMLDivElement;

	return Boolean(target.innerText.trim());
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

const RichTextMessageBox = ({
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

	const [typing, setTyping] = useReducer(reducer, false);

	const { isMobile } = useLayout();
	const sendOnEnterBehavior = useUserPreference<'normal' | 'alternative' | 'desktop'>('sendOnEnter') || isMobile;
	const sendOnEnter = sendOnEnterBehavior == null || sendOnEnterBehavior === 'normal' || (sendOnEnterBehavior === 'desktop' && !isMobile);

	if (!chat) {
		throw new Error('Chat context not found');
	}

	// We store the last known cursor position for each contenteditable div using a WeakMap keyed by the element.
	// This allows us to restore the caret position when the user refocuses the editor,
	// preventing the cursor from jumping to the start and improving typing experience in multiple composer instances.
	const cursorMap = new WeakMap<HTMLElement, number>();

	const setLastCursorPosition = (e: React.FocusEvent<HTMLElement>) => {
		const node = e.currentTarget as HTMLDivElement;
		const { selectionStart } = getSelectionRange(node);
		cursorMap.set(node, selectionStart);
		console.log('Saved cursor position for:', node, selectionStart);
	};

	const getLastCursorPosition = (e: React.FocusEvent<HTMLElement>) => {
		const node = e.currentTarget as HTMLDivElement;
		const savedPosition = cursorMap.get(node);
		if (savedPosition === undefined) return; // no saved cursor position

		// Use the same value for start and end to place caret at a single point
		setSelectionRange(node, savedPosition, savedPosition);

		console.log('Restored cursor position for:', node, savedPosition);
	};

	/* const textareaRef = useRef<HTMLTextAreaElement>(null); */

	/* NEW: contenteditableRef */
	const contentEditableRef = useRef<HTMLDivElement>(null);

	const messageComposerRef = useRef<HTMLElement>(null);
	const shadowRef = useRef<HTMLDivElement>(null);

	const storageID = `messagebox_${room._id}${tmid ? `-${tmid}` : ''}`;

	const callbackRef = useCallback(
		(node: HTMLDivElement) => {
			if (node === null && chat.composer) {
				return chat.setComposerAPI();
			}

			if (chat.composer) {
				return;
			}
			chat.setComposerAPI(createRichTextComposerAPI(node, storageID));
		},
		[chat, storageID],
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
		if (chat.currentEditing) {
			event.preventDefault();
			event.stopPropagation();

			chat.currentEditing.reset().then((reset) => {
				if (!reset) {
					chat.currentEditing?.cancel();
				}
			});
		}
	};

	const keyboardEventHandler = useEffectEvent((event: KeyboardEvent) => {
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

		if (chat.composer && handleFormattingShortcut(event, [...formattingButtons], chat.composer)) {
			return;
		}

		if (event.shiftKey || event.ctrlKey || event.metaKey) {
			return;
		}

		switch (event.key) {
			case 'Escape': {
				closeEditing(event);
				if (!input.innerText.trim()) onEscape?.();
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

				if (selectionEnd === input.innerText.length) {
					event.preventDefault();
					event.stopPropagation();

					onNavigateToNextMessage?.();

					if (event.altKey) {
						setSelectionRange(input, input.innerText.length, input.innerText.length);
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

	/* const { textAreaStyle, shadowStyle } = useAutoGrow(textareaRef, shadowRef, isRecordingAudio); */

	const canSend = useReactiveValue(useCallback(() => roomCoordinator.verifyCanSendMessage(room._id), [room._id]));

	/* const sizes = useContentBoxSize(textareaRef); */

	const newSizes = useContentBoxSize(contentEditableRef);

	const format = useFormatDateAndTime();

	const joinMutation = useMutation({
		mutationFn: async () => onJoin?.(),
	});

	const handlePaste = useEffectEvent((event: ClipboardEvent<HTMLDivElement>) => {
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
			(node: HTMLDivElement) => {
				if (node === null) {
					return;
				}
				const eventHandler = (e: KeyboardEvent) => keyboardEventHandler(e);
				node.addEventListener('keydown', eventHandler);

				return () => {
					node.removeEventListener('keydown', eventHandler);
				};
			},
			[keyboardEventHandler],
		),
	);

	/* const mergedRefs = useMessageComposerMergedRefs(popup.callbackRef, textareaRef, callbackRef, autofocusRef, keyDownHandlerCallbackRef); */

	/* New mergedRefs */
	const newMergedRefs = useMessageComposerMergedRefs(
		popup.callbackRef,
		contentEditableRef,
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
			<MessageComposerHint icon='flask' helperText=''>
				Experiment: Real Time Composer
			</MessageComposerHint>
			<MessageBoxHint
				isEditing={isEditing}
				e2eEnabled={e2eEnabled}
				unencryptedMessagesAllowed={unencryptedMessagesAllowed}
				isMobile={isMobile}
			/>
			{isRecordingVideo && <VideoMessageRecorder reference={messageComposerRef} rid={room._id} tmid={tmid} />}
			<MessageComposer ref={messageComposerRef} variant={isEditing ? 'editing' : undefined}>
				{isRecordingAudio && <AudioMessageRecorder rid={room._id} isMicrophoneDenied={isMicrophoneDenied} />}
				<RichTextComposerInput
					ref={newMergedRefs}
					aria-label={composerPlaceholder}
					name='msg'
					disabled={isRecording || !canSend}
					onInput={setTyping}
					/* style={textAreaStyle} */
					placeholder={composerPlaceholder}
					onPaste={handlePaste}
					aria-activedescendant={popup.focused ? `popup-item-${popup.focused._id}` : undefined}
					onBlur={setLastCursorPosition}
					onFocus={getLastCursorPosition}
				/>
				<div ref={shadowRef} /* style={shadowStyle} */ />
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
								variant={newSizes.inlineSize < 480 ? 'small' : 'large'}
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
							variant={newSizes.inlineSize < 480 ? 'small' : 'large'}
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

export default memo(RichTextMessageBox);
