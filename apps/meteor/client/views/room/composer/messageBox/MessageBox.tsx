/* eslint-disable complexity */
import type { IMessage, ISubscription, IUpload, IE2EEMessage, FileAttachmentProps } from '@rocket.chat/core-typings';
import { useContentBoxSize, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	MessageComposerAction,
	MessageComposerToolbarActions,
	MessageComposer,
	MessageComposerInput,
	MessageComposerToolbar,
	MessageComposerActionsDivider,
	MessageComposerToolbarSubmit,
	MessageComposerHint,
	MessageComposerButton,
} from '@rocket.chat/ui-composer';
import { useTranslation, useUserPreference, useLayout, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement, MouseEventHandler, FormEvent, ClipboardEventHandler, MouseEvent } from 'react';
import React, { memo, useRef, useReducer, useCallback, useState } from 'react';
import { Trans } from 'react-i18next';
import { useSubscription } from 'use-subscription';

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
import { useComposerPopup } from '../../contexts/ComposerPopupContext';
import { useRoom } from '../../contexts/RoomContext';
import ComposerBoxPopup from '../ComposerBoxPopup';
import ComposerBoxPopupPreview from '../ComposerBoxPopupPreview';
import ComposerUserActionIndicator from '../ComposerUserActionIndicator';
import { useAutoGrow } from '../RoomComposer/hooks/useAutoGrow';
import { useComposerBoxPopup } from '../hooks/useComposerBoxPopup';
import { useEnablePopupPreview } from '../hooks/useEnablePopupPreview';
import { useMessageComposerMergedRefs } from '../hooks/useMessageComposerMergedRefs';
import MessageBoxActionsToolbar from './MessageBoxActionsToolbar';
import MessageBoxFormattingToolbar from './MessageBoxFormattingToolbar';
import MessageBoxReplies from './MessageBoxReplies';
import { useMessageBoxAutoFocus } from './hooks/useMessageBoxAutoFocus';
import { useMessageBoxPlaceholder } from './hooks/useMessageBoxPlaceholder';
import fileSize from 'filesize';
import { e2e } from '../../../../../app/e2e/client';
import { getFileExtension } from '../../../../../lib/utils/getFileExtension';
import { Box } from '@rocket.chat/fuselage';
import FilePreview from '../../modals/FileUploadModal/FilePreview';

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

type MessageBoxProps = {
	tmid?: IMessage['_id'];
	readOnly: boolean;
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
	readOnly,
	tshow,
	previewUrls,
}: MessageBoxProps): ReactElement => {
	const chat = useChat();
	const room = useRoom();
	const t = useTranslation();
	const e2eEnabled = useSetting<boolean>('E2E_Enable');
	const unencryptedMessagesAllowed = useSetting<boolean>('E2E_Allow_Unencrypted_Messages');
	const isSlashCommandAllowed = !e2eEnabled || !room.encrypted || unencryptedMessagesAllowed;
	const composerPlaceholder = useMessageBoxPlaceholder(t('Message'), room);

	const [typing, setTyping] = useReducer(reducer, false);
	const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
	const dispatchToastMessage = useToastMessageDispatch();
	const maxFileSize = useSetting('FileUpload_MaxFileSize') as number;

	function handleFileUpload(filesList: File[], resetFileInput?: () => void) {
		setFilesToUpload((prevFiles) => {
			let newFilesToUpload = [...prevFiles, ...filesList];

			if (newFilesToUpload.length > 6) {
				newFilesToUpload = newFilesToUpload.slice(0, 6);
				dispatchToastMessage({
					type: 'error',
					message: "You can't upload more than 6 files at once. Only the first 6 files will be uploaded.",
				});
			}

			const validFiles = newFilesToUpload.filter((queuedFile) => {
				const { name, size } = queuedFile;

				if (!name) {
					dispatchToastMessage({
						type: 'error',
						message: t('error-the-field-is-required', { field: t('Name') }),
					});
					return false;
				}

				if (maxFileSize > -1 && (size || 0) > maxFileSize) {
					dispatchToastMessage({
						type: 'error',
						message: `${t('File_exceeds_allowed_size_of_bytes', { size: fileSize(maxFileSize) })}`,
					});
					return false;
				}

				return true;
			});

			return validFiles;
		});

		resetFileInput?.();
	}

	// function handleFileUpload(fileslist: File[], resetFileInput?: () => void) {
	// 	setFilesToUpload((prevFiles) => [...prevFiles, ...fileslist]);

	// 	resetFileInput?.();
	// }

	const handleRemoveFile = (index: number) => {
		const temp = [...filesToUpload];
		temp.splice(index, 1);
		setFilesToUpload(temp);
	};

	const getHeightAndWidthFromDataUrl = (dataURL: string): Promise<{ height: number; width: number }> => {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => {
				resolve({
					height: img.height,
					width: img.width,
				});
			};
			img.src = dataURL;
		});
	};
	const uploadFile = (
		file: File[] | File,
		extraData?: Pick<IMessage, 't' | 'e2e'> & { msg?: string },
		getContent?: (fileId: string[], fileUrl: string[]) => Promise<IE2EEMessage['content']>,
		fileContent?: { raw: Partial<IUpload>; encrypted?: { algorithm: string; ciphertext: string } | undefined },
	) => {
		if (!chat) {
			console.error('Chat context not found');
			return;
		}
		const msg = chat.composer?.text ?? '';
		chat.composer?.clear();
		setFilesToUpload([]);
		chat.uploads.send(
			file,
			{
				msg,
				...extraData,
			},
			getContent,
			fileContent,
		);
	};
	const { isMobile } = useLayout();
	const sendOnEnterBehavior = useUserPreference<'normal' | 'alternative' | 'desktop'>('sendOnEnter') || isMobile;
	const sendOnEnter = sendOnEnterBehavior == null || sendOnEnterBehavior === 'normal' || (sendOnEnterBehavior === 'desktop' && !isMobile);

	if (!chat) {
		throw new Error('Chat context not found');
	}

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const messageComposerRef = useRef<HTMLElement>(null);
	const shadowRef = useRef<HTMLDivElement>(null);

	const storageID = `messagebox_${room._id}${tmid ? `-${tmid}` : ''}`;

	const callbackRef = useCallback(
		(node: HTMLTextAreaElement) => {
			if (node === null || chat.composer) {
				return;
			}
			chat.setComposerAPI(createComposerAPI(node, storageID));
		},
		[chat, storageID],
	);

	const autofocusRef = useMessageBoxAutoFocus(!isMobile);

	const useEmojis = useUserPreference<boolean>('useEmojis');

	const handleOpenEmojiPicker: MouseEventHandler<HTMLElement> = useMutableCallback((e) => {
		e.stopPropagation();
		e.preventDefault();

		if (!useEmojis) {
			return;
		}

		const ref = messageComposerRef.current as HTMLElement;
		chat.emojiPicker.open(ref, (emoji: string) => chat.composer?.insertText(` :${emoji}: `));
	});

	const handleSendMessage = useMutableCallback(async () => {
		if (filesToUpload.length > 0) {
			const msg = chat.composer?.text ?? '';

			Object.defineProperty(filesToUpload[0], 'name', {
				writable: true,
				value: filesToUpload[0].name,
			});

			const e2eRoom = await e2e.getInstanceByRoomId(room._id);

			if (!e2eRoom) {
				uploadFile(filesToUpload, { msg });
				return;
			}

			const shouldConvertSentMessages = await e2eRoom.shouldConvertSentMessages({ msg });

			if (!shouldConvertSentMessages) {
				uploadFile(filesToUpload, { msg });
				return;
			}

			const encryptedFilesarray: any = await Promise.all(filesToUpload.map((file) => e2eRoom.encryptFile(file)));
			const filesarray = encryptedFilesarray.map((file: any) => file?.file);

			if (encryptedFilesarray[0]) {
				const getContent = async (_id: string[], fileUrl: string[]): Promise<IE2EEMessage['content']> => {
					const attachments = [];
					const arrayoffiles = [];
					for (let i = 0; i < _id.length; i++) {
						const attachment: FileAttachmentProps = {
							title: filesToUpload[i].name,
							type: 'file',
							title_link: fileUrl[i],
							title_link_download: true,
							encryption: {
								key: encryptedFilesarray[i].key,
								iv: encryptedFilesarray[i].iv,
							},
							hashes: {
								sha256: encryptedFilesarray[i].hash,
							},
						};

						if (/^image\/.+/.test(filesToUpload[i].type)) {
							const dimensions = await getHeightAndWidthFromDataUrl(window.URL.createObjectURL(filesToUpload[i]));

							attachments.push({
								...attachment,
								image_url: fileUrl[i],
								image_type: filesToUpload[i].type,
								image_size: filesToUpload[i].size,
								...(dimensions && {
									image_dimensions: dimensions,
								}),
							});
						} else if (/^audio\/.+/.test(filesToUpload[i].type)) {
							attachments.push({
								...attachment,
								audio_url: fileUrl[i],
								audio_type: filesToUpload[i].type,
								audio_size: filesToUpload[i].size,
							});
						} else if (/^video\/.+/.test(filesToUpload[i].type)) {
							attachments.push({
								...attachment,
								video_url: fileUrl[i],
								video_type: filesToUpload[i].type,
								video_size: filesToUpload[i].size,
							});
						} else {
							attachments.push({
								...attachment,
								size: filesToUpload[i].size,
								format: getFileExtension(filesToUpload[i].name),
							});
						}

						const files = {
							_id: _id[i],
							name: filesToUpload[i].name,
							type: filesToUpload[i].type,
							size: filesToUpload[i].size,
						};
						arrayoffiles.push(files);
					}

					return e2eRoom.encryptMessageContent({
						attachments,
						files: arrayoffiles,
						file: filesToUpload[0],
					});
				};

				const fileContentData = {
					type: filesToUpload[0].type,
					typeGroup: filesToUpload[0].type.split('/')[0],
					name: filesToUpload[0].name,
					msg: msg || '',
					encryption: {
						key: encryptedFilesarray[0].key,
						iv: encryptedFilesarray[0].iv,
					},
					hashes: {
						sha256: encryptedFilesarray[0].hash,
					},
				};

				const fileContent = await e2eRoom.encryptMessageContent(fileContentData);

				const uploadFileData = {
					raw: {},
					encrypted: fileContent,
				};
				uploadFile(
					filesarray,
					{
						t: 'e2e',
					},
					getContent,
					uploadFileData,
				);
			}
			chat.composer?.clear();
			return;
		}
		const text = chat.composer?.text ?? '';
		chat.composer?.clear();
		clearPopup();

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

	const handler = useMutableCallback((event: KeyboardEvent) => {
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

	const isEditing = useSubscription({
		getCurrentValue: chat.composer?.editing.get ?? getEmptyFalse,
		subscribe: chat.composer?.editing.subscribe ?? emptySubscribe,
	});

	const isRecordingAudio = useSubscription({
		getCurrentValue: chat.composer?.recording.get ?? getEmptyFalse,
		subscribe: chat.composer?.recording.subscribe ?? emptySubscribe,
	});

	const isMicrophoneDenied = useSubscription({
		getCurrentValue: chat.composer?.isMicrophoneDenied.get ?? getEmptyFalse,
		subscribe: chat.composer?.isMicrophoneDenied.subscribe ?? emptySubscribe,
	});

	const isRecordingVideo = useSubscription({
		getCurrentValue: chat.composer?.recordingVideo.get ?? getEmptyFalse,
		subscribe: chat.composer?.recordingVideo.subscribe ?? emptySubscribe,
	});

	const formatters = useSubscription({
		getCurrentValue: chat.composer?.formatters.get ?? getEmptyArray,
		subscribe: chat.composer?.formatters.subscribe ?? emptySubscribe,
	});

	const isRecording = isRecordingAudio || isRecordingVideo;

	const { textAreaStyle, shadowStyle } = useAutoGrow(textareaRef, shadowRef, isRecordingAudio);

	const canSend = useReactiveValue(useCallback(() => roomCoordinator.verifyCanSendMessage(room._id), [room._id]));

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

	const composerPopupConfig = useComposerPopup();

	const {
		popup,
		focused,
		items,
		ariaActiveDescendant,
		suspended,
		select,
		commandsRef,
		callbackRef: c,
		filter,
		clearPopup,
	} = useComposerBoxPopup<{ _id: string; sort?: number }>({
		configurations: composerPopupConfig,
	});

	const keyDownHandlerCallbackRef = useCallback(
		(node: HTMLTextAreaElement) => {
			if (node === null) {
				return;
			}
			node.addEventListener('keydown', (e: KeyboardEvent) => {
				handler(e);
			});
		},
		[handler],
	);

	const mergedRefs = useMessageComposerMergedRefs(c, textareaRef, callbackRef, autofocusRef, keyDownHandlerCallbackRef);

	const shouldPopupPreview = useEnablePopupPreview(filter, popup);

	return (
		<>
			{chat.composer?.quotedMessages && <MessageBoxReplies />}
			{shouldPopupPreview && popup && (
				<ComposerBoxPopup select={select} items={items} focused={focused} title={popup.title} renderItem={popup.renderItem} />
			)}
			{/*
				SlashCommand Preview popup works in a weird way
				There is only one trigger for all the commands: "/"
				After that we need to the slashcommand list and check if the command exists and provide the preview
				if not the query is `suspend` which means the slashcommand is not found or doesn't have a preview
			*/}
			{popup?.preview && (
				<ComposerBoxPopupPreview
					select={select}
					items={items as any}
					focused={focused as any}
					renderItem={popup.renderItem}
					ref={commandsRef}
					rid={room._id}
					tmid={tmid}
					suspended={suspended}
				/>
			)}
			{isEditing && (
				<MessageComposerHint
					icon='pencil'
					helperText={
						!isMobile ? (
							<Trans i18nKey='Editing_message_hint'>
								<strong>esc</strong> to cancel · <strong>enter</strong> to save
							</Trans>
						) : undefined
					}
				>
					{t('Editing_message')}
				</MessageComposerHint>
			)}
			{readOnly && !isEditing && <MessageComposerHint>{t('This_room_is_read_only')}</MessageComposerHint>}
			{isRecordingVideo && <VideoMessageRecorder reference={messageComposerRef} rid={room._id} tmid={tmid} />}
			<MessageComposer ref={messageComposerRef} variant={isEditing ? 'editing' : undefined}>
				{isRecordingAudio && <AudioMessageRecorder rid={room._id} isMicrophoneDenied={isMicrophoneDenied} />}
				<MessageComposerInput
					ref={mergedRefs}
					aria-label={composerPlaceholder}
					name='msg'
					disabled={isRecording || !canSend}
					onChange={setTyping}
					style={textAreaStyle}
					placeholder={composerPlaceholder}
					onPaste={handlePaste}
					aria-activedescendant={ariaActiveDescendant}
				/>
				<div ref={shadowRef} style={shadowStyle} />
				<Box
					display='flex'
					style={{
						gap: '3px',
						width: '100%',
					}}
				>
					{filesToUpload.length > 0 && (
						<>
							{filesToUpload.map((file, index) => (
								<FilePreview key={index} file={file} index={index} onRemove={handleRemoveFile} />
							))}
						</>
					)}
				</Box>
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
							handleFiles={handleFileUpload}
						/>
					</MessageComposerToolbarActions>
					<MessageComposerToolbarSubmit>
						{!canSend && (
							<MessageComposerButton primary onClick={onJoin} loading={joinMutation.isLoading}>
								{t('Join')}
							</MessageComposerButton>
						)}
						{canSend && (
							<>
								{isEditing && <MessageComposerButton onClick={closeEditing}>{t('Cancel')}</MessageComposerButton>}
								<MessageComposerAction
									aria-label={t('Send')}
									icon='send'
									disabled={!canSend || (!typing && !isEditing && !(filesToUpload.length > 0))}
									onClick={handleSendMessage}
									secondary={typing || isEditing || filesToUpload.length > 0}
									info={typing || isEditing || filesToUpload.length > 0}
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
