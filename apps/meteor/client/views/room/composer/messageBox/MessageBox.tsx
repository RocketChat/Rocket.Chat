/* eslint-disable complexity */
import { isRoomFederated, isRoomNativeFederated, type IMessage, type ISubscription } from '@rocket.chat/core-typings';
import { useContentBoxSize, useDarkMode, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSafeRefCallback } from '@rocket.chat/ui-client';
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
import { useTranslation, useUserPreference, useLayout, useSetting, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ReactElement, FormEvent, MouseEvent, ClipboardEvent } from 'react';
import { Fragment, memo, useRef, useReducer, useCallback, useMemo, useSyncExternalStore } from 'react';

import MessageBoxActionsToolbar from './MessageBoxActionsToolbar';
import MessageBoxFormattingToolbar from './MessageBoxFormattingToolbar';
import MessageBoxHint from './MessageBoxHint';
import MessageBoxReplies from './MessageBoxReplies';
import '../ComposerUserActionIndicator/ComposerUserActionIndicator.css';
import { createComposerAPI } from '../../../../../app/ui-message/client/messageBox/createComposerAPI';
import type { FormattingButton } from '../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { formattingButtons } from '../../../../../app/ui-message/client/messageBox/messageBoxFormatting';
import { UserAction } from '../../../../../app/ui/client/lib/UserAction';
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

const emptySubscribe = () => () => undefined;
const getEmptyFalse = () => false;
const a: any[] = [];
const getEmptyArray = () => a;
const maxUsernames = 5;
const MEDSENSE_LABEL = 'medsense';
type ActivityAction = 'typing' | 'recording' | 'uploading' | 'playing' | 'medsense-processing-form' | 'medsense-preparing-form';

const getActivityAction = (key: string): ActivityAction => {
	if (key === 'medsense-processing-form' || key === 'medsense-preparing-form') {
		return key;
	}

	return key.split('-')[1] as ActivityAction;
};

const MessageBoxUserActionIndicator = ({ rid, tmid }: { rid: string; tmid?: string }): ReactElement | null => {
	const t = useTranslation();
	const isDarkMode = useDarkMode();

	const roomAction = useSyncExternalStore(
		UserAction.subscribe,
		useCallback(() => UserAction.get(tmid || rid), [rid, tmid]),
	);

	const actions = useMemo(
		() =>
			Object.entries(roomAction ?? {})
				.map(([key, usersMap]) => {
					const action = getActivityAction(key);
					const users = Object.keys(usersMap || {});
					if (!users.length) {
						return;
					}

					return { action, users };
				})
				.filter(Boolean) as Array<{
				action: ActivityAction;
				users: string[];
			}>,
		[roomAction],
	);

	const formatUsers = useCallback(
		(users: string[]) => {
			if (users.length < maxUsernames) {
				return users.join(', ');
			}

			return `${users.slice(0, maxUsernames - 1).join(', ')} ${t('and')} ${t('others')}`;
		},
		[t],
	);

	const activityPhrases = useMemo(() => {
		return actions.flatMap(({ action, users }) => {
			const normalizedUsers = users.map((user) => user.trim().toLowerCase());
			const hasMedsense = action === 'typing' && normalizedUsers.includes(MEDSENSE_LABEL);
			const nonMedsenseUsers = users.filter((user) => user.trim().toLowerCase() !== MEDSENSE_LABEL);

			const phrases: string[] = [];
			if (hasMedsense) {
				phrases.push('MedSense is thinking');
			}
			if (action === 'medsense-processing-form' && normalizedUsers.includes(MEDSENSE_LABEL)) {
				phrases.push('MedSense is processing form');
			}
			if (action === 'medsense-preparing-form' && normalizedUsers.includes(MEDSENSE_LABEL)) {
				phrases.push('MedSense is preparing form');
			}

			if (nonMedsenseUsers.length > 0 && !action.startsWith('medsense-')) {
				const userList = formatUsers(nonMedsenseUsers);
				phrases.push(`${userList} ${nonMedsenseUsers.length > 1 ? t(`are_${action}`) : t(`is_${action}`)}`);
			}

			if (!phrases.length && users.length > 0 && !action.startsWith('medsense-')) {
				const userList = formatUsers(users);
				phrases.push(`${userList} ${users.length > 1 ? t(`are_${action}`) : t(`is_${action}`)}`);
			}

			return phrases;
		});
	}, [actions, formatUsers, t]);

	if (!activityPhrases.length) {
		return null;
	}

	return (
		<div
			className={`rc-message-box__activity-wrapper rc-message-box__activity-wrapper--medsense ${
				isDarkMode ? 'rc-message-box__activity-wrapper--theme-dark' : 'rc-message-box__activity-wrapper--theme-light'
			}`}
			aria-live='polite'
		>
			<span className='rc-message-box__activity-pill'>
				{activityPhrases.map((phrase, index) => (
					<Fragment key={`${phrase}-${index}`}>
						{index > 0 && ', '}
						{phrase}
					</Fragment>
				))}
			</span>
		</div>
	);
};

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

type SmartFormsComposerState = {
	pendingCount?: number;
	viewerCanAnswer?: boolean;
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
	const quoteChainLimit = useSetting('Message_QuoteChainLimit', 2);
	const [typing, setTyping] = useReducer(reducer, false);

	const { isMobile } = useLayout();
	const sendOnEnterBehavior = useUserPreference<'normal' | 'alternative' | 'desktop'>('sendOnEnter') || isMobile;
	const sendOnEnter = sendOnEnterBehavior == null || sendOnEnterBehavior === 'normal' || (sendOnEnterBehavior === 'desktop' && !isMobile);
	const getRoomSmartForms = useEndpoint('GET', '/v1/medsense/room.smartforms' as any);

	if (!chat) {
		throw new Error('Chat context not found');
	}

	const { data: smartFormsState } = useQuery({
		queryKey: ['medsense-room-smartforms', room._id],
		queryFn: async () => (await getRoomSmartForms({ roomId: room._id })) as SmartFormsComposerState,
		enabled: Boolean(room._id),
		refetchInterval: 5000,
	});
	const isMedsenseFormLocked = Boolean(smartFormsState?.viewerCanAnswer) && Number(smartFormsState?.pendingCount || 0) > 0;
	const composerPlaceholder = useMessageBoxPlaceholder(
		isMedsenseFormLocked ? 'Complete the Smart Form above to continue' : t('Message'),
		room,
	);

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
			chat.setComposerAPI(createComposerAPI(node, storageID, quoteChainLimit));
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
	const canInteractWithComposer = canSend && !isMedsenseFormLocked;

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
			<MessageBoxUserActionIndicator rid={room._id} tmid={tmid} />
			<MessageComposer ref={messageComposerRef} variant={isEditing ? 'editing' : undefined}>
				{isRecordingAudio && <AudioMessageRecorder rid={room._id} isMicrophoneDenied={isMicrophoneDenied} />}
				<MessageComposerInputExpandable
					dimensions={sizes}
					ref={mergedRefs}
					aria-label={composerPlaceholder}
					name='msg'
					disabled={isRecording || !canInteractWithComposer}
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
							disabled={!useEmojis || isRecording || !canInteractWithComposer}
							onClick={handleOpenEmojiPicker}
							title={t('Emoji')}
						/>
						<MessageComposerActionsDivider />
						{chat.composer && formatters.length > 0 && (
							<MessageBoxFormattingToolbar
								composer={chat.composer}
								variant={sizes.inlineSize < 480 ? 'small' : 'large'}
								items={formatters}
								disabled={isRecording || !canInteractWithComposer}
							/>
						)}
						<MessageBoxActionsToolbar
							canSend={canInteractWithComposer}
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
									disabled={!canInteractWithComposer || (!typing && !isEditing)}
									onClick={handleSendMessage}
									secondary={typing || isEditing}
									info={typing || isEditing}
								/>
							</>
						)}
					</MessageComposerToolbarSubmit>
				</MessageComposerToolbar>
			</MessageComposer>
		</>
	);
};

export default memo(MessageBox);
