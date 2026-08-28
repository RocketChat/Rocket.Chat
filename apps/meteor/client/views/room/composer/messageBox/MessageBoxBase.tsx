import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import {
	MessageComposerAction,
	MessageComposerToolbarActions,
	MessageComposer,
	MessageComposerToolbar,
	MessageComposerActionsDivider,
	MessageComposerToolbarSubmit,
	MessageComposerButton,
} from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { MouseEvent, ReactNode, RefObject } from 'react';

import MessageBoxActionsToolbar from './MessageBoxActionsToolbar';
import MessageBoxFormattingToolbar from './MessageBoxFormattingToolbar';
import MessageBoxHint from './MessageBoxHint';
import MessageBoxReplies from './MessageBoxReplies';
import type { ComposerAPI } from '../../../../lib/chats/ChatAPI';
import type { FormattingButton } from '../../../../lib/messageBoxFormatting';
import AudioMessageRecorder from '../../../composer/AudioMessageRecorder';
import VideoMessageRecorder from '../../../composer/VideoMessageRecorder';
import ComposerBoxPopup from '../ComposerBoxPopup';
import ComposerBoxPopupPreview from '../ComposerBoxPopupPreview';
import ComposerUserActionIndicator from '../ComposerUserActionIndicator';
import type { useComposerBoxPopup } from '../hooks/useComposerBoxPopup';

type MessageBoxBaseProps = {
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
	input: ReactNode;
	hint?: ReactNode;
	files?: ReactNode;
	composer?: ComposerAPI;
	messageComposerRef: RefObject<HTMLElement | null>;
	popup: ReturnType<typeof useComposerBoxPopup>;
	shouldPopupPreview?: boolean;
	isEditing: boolean;
	isRecording: boolean;
	isRecordingAudio: boolean;
	isRecordingVideo: boolean;
	isMicrophoneDenied: boolean;
	formatters: FormattingButton[];
	canSend: boolean;
	useEmojis?: boolean;
	sendEnabled: boolean;
	sendActive: boolean;
	inlineSize: number;
	e2eEnabled: boolean;
	unencryptedMessagesAllowed: boolean;
	isMobile: boolean;
	joinPending: boolean;
	onEmojiClick: (e: MouseEvent<HTMLElement>) => void;
	onSend: () => void;
	onJoin?: () => Promise<void>;
	closeEditing: (event: MouseEvent<HTMLElement>) => void;
};

const MessageBoxBase = ({
	rid,
	tmid,
	input,
	hint,
	files,
	composer,
	messageComposerRef,
	popup,
	shouldPopupPreview,
	isEditing,
	isRecording,
	isRecordingAudio,
	isRecordingVideo,
	isMicrophoneDenied,
	formatters,
	canSend,
	useEmojis,
	sendEnabled,
	sendActive,
	inlineSize,
	e2eEnabled,
	unencryptedMessagesAllowed,
	isMobile,
	joinPending,
	onEmojiClick,
	onSend,
	onJoin,
	closeEditing,
}: MessageBoxBaseProps) => {
	const t = useTranslation();

	const variant = inlineSize < 480 ? 'small' : 'large';

	return (
		<>
			{composer?.quotedMessages && <MessageBoxReplies />}
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
					rid={rid}
					tmid={tmid}
					suspended={popup.suspended}
				/>
			)}
			{hint}
			<MessageBoxHint
				isEditing={isEditing}
				e2eEnabled={e2eEnabled}
				unencryptedMessagesAllowed={unencryptedMessagesAllowed}
				isMobile={isMobile}
			/>
			{isRecordingVideo && <VideoMessageRecorder reference={messageComposerRef} rid={rid} tmid={tmid} />}
			<MessageComposer ref={messageComposerRef} variant={isEditing ? 'editing' : undefined}>
				{isRecordingAudio && <AudioMessageRecorder rid={rid} isMicrophoneDenied={isMicrophoneDenied} />}
				{input}
				{files}
				<MessageComposerToolbar>
					<MessageComposerToolbarActions aria-label={t('Message_composer_toolbox_primary_actions')}>
						<MessageComposerAction
							icon='emoji'
							disabled={!useEmojis || isRecording || !canSend}
							onClick={onEmojiClick}
							title={t('Emoji')}
						/>
						<MessageComposerActionsDivider />
						{composer && formatters.length > 0 && (
							<MessageBoxFormattingToolbar composer={composer} variant={variant} items={formatters} disabled={isRecording || !canSend} />
						)}
						<MessageBoxActionsToolbar
							canSend={canSend}
							isMicrophoneDenied={isMicrophoneDenied}
							rid={rid}
							tmid={tmid}
							isRecording={isRecording}
							variant={variant}
							isEditing={isEditing}
						/>
					</MessageComposerToolbarActions>
					<MessageComposerToolbarSubmit>
						{!canSend && (
							<MessageComposerButton primary onClick={onJoin} loading={joinPending}>
								{t('Join')}
							</MessageComposerButton>
						)}
						{canSend && (
							<>
								{isEditing && <MessageComposerButton onClick={closeEditing}>{t('Cancel')}</MessageComposerButton>}
								<MessageComposerAction
									aria-label={t('Send')}
									icon='send'
									disabled={!sendEnabled}
									onClick={onSend}
									secondary={sendActive}
									info={sendActive}
								/>
							</>
						)}
					</MessageComposerToolbarSubmit>
				</MessageComposerToolbar>
			</MessageComposer>
			<ComposerUserActionIndicator rid={rid} tmid={tmid} />
		</>
	);
};

export default MessageBoxBase;
