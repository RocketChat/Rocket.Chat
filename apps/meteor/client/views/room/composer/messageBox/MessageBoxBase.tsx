import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Box, SplitButton } from '@rocket.chat/fuselage';
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
import ScheduleMessageMenu from './ScheduleMessage/ScheduleMessageMenu';
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
	tshow?: IMessage['tshow'];
	input: ReactNode;
	hint?: ReactNode;
	files?: ReactNode;
	composer?: ComposerAPI;
	messageComposerRef: RefObject<HTMLElement | null>;
	popup: ReturnType<typeof useComposerBoxPopup>;
	shouldPopupPreview?: boolean;
	isEditing: boolean;
	isEditingScheduled?: boolean;
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
	tshow,
	input,
	hint,
	files,
	composer,
	messageComposerRef,
	popup,
	shouldPopupPreview,
	isEditing,
	isEditingScheduled = false,
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
					hover={popup.hover}
					items={popup.items}
					focused={popup.focused}
					focusVisible={popup.focusVisible}
					listboxId={popup.listboxId}
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
					hover={popup.hover}
					items={popup.items as any}
					focused={popup.focused as any}
					focusVisible={popup.focusVisible}
					listboxId={popup.listboxId}
					title={popup.option.title}
					renderItem={popup.option.renderItem}
					ref={popup.commandsRef}
					rid={rid}
					tmid={tmid}
					suspended={popup.suspended}
				/>
			)}
			<MessageBoxHint
				isEditing={isEditing}
				isEditingScheduled={isEditingScheduled}
				e2eEnabled={e2eEnabled}
				unencryptedMessagesAllowed={unencryptedMessagesAllowed}
				isMobile={isMobile}
			/>
			{isRecordingVideo && <VideoMessageRecorder reference={messageComposerRef} rid={rid} tmid={tmid} />}
			<MessageComposer ref={messageComposerRef} variant={isEditing || isEditingScheduled ? 'editing' : undefined}>
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
							<MessageComposerButton variant='primary' onClick={onJoin} loading={joinPending}>
								{t('Join')}
							</MessageComposerButton>
						)}
						{canSend && (
							<>
								{(isEditing || isEditingScheduled) && <MessageComposerButton onClick={closeEditing}>{t('Cancel')}</MessageComposerButton>}
								<SplitButton primary={sendActive} aria-label={t('Send')}>
									<MessageComposerAction
										aria-label={t('Send')}
										icon='send'
										disabled={!sendEnabled}
										onClick={onSend}
										variant={sendActive ? 'primary' : undefined}
									/>
									<ScheduleMessageMenu
										rid={rid}
										tmid={tmid}
										tshow={tshow}
										composer={composer}
										disabled={!sendEnabled || isEditing || isEditingScheduled}
									/>
								</SplitButton>
							</>
						)}
					</MessageComposerToolbarSubmit>
				</MessageComposerToolbar>
			</MessageComposer>
			<Box display='flex' alignItems='center' justifyContent='space-between'>
				<ComposerUserActionIndicator rid={rid} tmid={tmid} />
				{hint}
			</Box>
		</>
	);
};

export default MessageBoxBase;
