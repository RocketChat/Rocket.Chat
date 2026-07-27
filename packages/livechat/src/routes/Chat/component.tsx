import type { EmojiData } from 'emoji-mart';
import type { TFunction } from 'i18next';
import type { RefObject } from 'preact';
import { Component, createRef } from 'preact';
import { Suspense, lazy } from 'preact/compat';
import { withTranslation } from 'react-i18next';

import styles from './styles.scss';
import { Button } from '../../components/Button';
import { Composer, ComposerAction, ComposerActions } from '../../components/Composer';
import { FilesDropTarget } from '../../components/FilesDropTarget';
import { FooterOptions, CharCounter } from '../../components/Footer';
import { MenuGroup, MenuItem } from '../../components/Menu';
import { MessageList } from '../../components/Messages';
import { Screen, ScreenContent, ScreenFooter } from '../../components/Screen';
import type { ScreenTheme } from '../../components/Screen/ScreenProvider';
import { createClassName } from '../../helpers/createClassName';
import type { formatAgent } from '../../helpers/formatAgent';
import ChangeIcon from '../../icons/change.svg';
import FinishIcon from '../../icons/finish.svg';
import PlusIcon from '../../icons/plus.svg';
import RemoveIcon from '../../icons/remove.svg';
import SendIcon from '../../icons/send.svg';
import EmojiIcon from '../../icons/smile.svg';
import type { Dispatch, StoreState } from '../../store';

import 'emoji-mart/css/emoji-mart.css';

const Picker = lazy(async () => {
	const { Picker } = await import('emoji-mart');
	return Picker;
});

type QueueInfo = {
	spot?: number;
	estimatedWaitTimeSeconds?: number;
	message?: { text?: string; user?: unknown };
};

export type ChatProps = {
	title?: string;
	uid?: string;
	agent?: ReturnType<typeof formatAgent>;
	typingUsernames?: string[];
	avatarResolver?: (username: string) => string | null | undefined;
	conversationFinishedMessage?: string;
	loading?: boolean;
	onUpload?: (files: (File | null)[]) => void;
	messages?: StoreState['messages'];
	uploads?: boolean;
	options?: boolean;
	onChangeDepartment?: (() => void) | null;
	onFinishChat?: (() => void) | null;
	onRemoveUserData?: (() => void) | null;
	lastReadMessageId?: string;
	queueInfo?: QueueInfo;
	registrationRequired?: boolean;
	onRegisterUser?: () => void;
	limitTextLength?: number;
	unread?: number;
	dispatch?: Dispatch;
	theme?: ScreenTheme;
	onTop?: () => void;
	onSubmit?: (text: string) => void;
	onChangeText?: (text: string) => void;
	onSoundStop?: () => void;
	t: TFunction;
};

type ChatState = {
	atBottom: boolean;
	text: string;
	emojiPickerActive: boolean;
};

class Chat extends Component<ChatProps, ChatState> {
	override state: ChatState = {
		atBottom: true,
		text: '',
		emojiPickerActive: false,
	};

	inputRef: RefObject<HTMLInputElement> = createRef();

	filesDropTarget: unknown = null;

	messagesContainer: HTMLElement | null = null;

	notifyEmojiSelect?: (native: string) => void;

	handleFilesDropTargetRef = (ref: unknown) => {
		this.filesDropTarget = ref;
	};

	handleMessagesContainerRef = (messagesContainer: { base?: HTMLElement } | null) => {
		this.messagesContainer = messagesContainer ? (messagesContainer.base ?? null) : null;
	};

	handleScrollTo = (region: string) => {
		const { onTop } = this.props;

		if (region === MessageList.SCROLL_AT_BOTTOM) {
			this.setState({ atBottom: true });
			return;
		}

		this.setState({ atBottom: false });

		if (region === MessageList.SCROLL_AT_TOP) {
			onTop?.();
		}
	};

	handleUploadClick = (event?: Event) => {
		event?.preventDefault();
		this.inputRef?.current?.click();
	};

	handleSendClick = (event?: Event) => {
		event?.preventDefault();
		this.handleSubmit(this.state.text);
	};

	handleSubmit = (text: string) => {
		if (this.props.onSubmit) {
			this.props.onSubmit(text);
			this.setState({ text: '' });
			this.turnOffEmojiPicker();
		}
	};

	handleChangeText = (text: string) => {
		let value = text;
		const { onChangeText, limitTextLength } = this.props;
		if (limitTextLength && limitTextLength < text.length) {
			value = value.substring(0, limitTextLength);
		}
		this.setState({ text: value });
		onChangeText?.(value);
	};

	toggleEmojiPickerState = () => {
		this.setState({ emojiPickerActive: !this.state.emojiPickerActive });
	};

	handleEmojiSelect = (emoji: EmojiData) => {
		this.toggleEmojiPickerState();
		if ('native' in emoji) {
			this.notifyEmojiSelect?.(emoji.native);
		}
	};

	handleEmojiClick = () => {
		this.turnOffEmojiPicker();
	};

	turnOffEmojiPicker = () => {
		if (this.state.emojiPickerActive) {
			this.setState({ emojiPickerActive: !this.state.emojiPickerActive });
		}
	};

	render = (
		{
			title,
			uid,
			agent,
			typingUsernames,
			avatarResolver,
			conversationFinishedMessage,
			loading,
			onUpload,
			messages,
			uploads = false,
			options,
			onChangeDepartment,
			onFinishChat,
			onRemoveUserData,
			lastReadMessageId,
			queueInfo,
			registrationRequired,
			onRegisterUser,
			limitTextLength,
			t,
			dispatch,
			theme,
			unread,
			onSoundStop,
		}: ChatProps,
		{ atBottom = true, text }: ChatState,
	) => (
		<Screen
			title={title || t('need_help')}
			agent={agent || null}
			queueInfo={queueInfo}
			className={createClassName(styles, 'chat')}
			unread={unread}
			onSoundStop={onSoundStop}
		>
			<FilesDropTarget inputRef={this.inputRef} overlayed overlayText={t('drop_here_to_upload_a_file')} onUpload={onUpload}>
				<ScreenContent nopadding>
					<div className={createClassName(styles, 'chat__messages', { atBottom, loading })}>
						<MessageList
							ref={this.handleMessagesContainerRef}
							avatarResolver={avatarResolver}
							uid={uid}
							messages={messages}
							typingUsernames={typingUsernames}
							conversationFinishedMessage={conversationFinishedMessage}
							lastReadMessageId={lastReadMessageId}
							handleEmojiClick={this.handleEmojiClick}
							dispatch={dispatch}
							hideSenderAvatar={theme?.hideGuestAvatar}
							hideReceiverAvatar={theme?.hideAgentAvatar}
							onScrollTo={this.handleScrollTo}
						/>
						{this.state.emojiPickerActive && (
							<Suspense fallback={null}>
								<Picker
									style={{ position: 'absolute', zIndex: 10, bottom: 0, maxWidth: '90%', left: 20, maxHeight: '90%' }}
									showPreview={false}
									showSkinTones={false}
									sheetSize={64}
									onSelect={this.handleEmojiSelect}
									autoFocus={true}
								/>
							</Suspense>
						)}
					</div>
				</ScreenContent>
				<ScreenFooter
					options={
						options && !registrationRequired ? (
							<FooterOptions>
								<MenuGroup>
									{onChangeDepartment && (
										<MenuItem onClick={onChangeDepartment} icon={ChangeIcon}>
											{t('change_department')}
										</MenuItem>
									)}
									{onRemoveUserData && (
										<MenuItem onClick={onRemoveUserData} icon={RemoveIcon}>
											{t('forget_remove_my_data')}
										</MenuItem>
									)}
									{onFinishChat && (
										<MenuItem danger onClick={onFinishChat} icon={FinishIcon}>
											{t('finish_this_chat')}
										</MenuItem>
									)}
								</MenuGroup>
							</FooterOptions>
						) : null
					}
					limit={limitTextLength ? <CharCounter limitTextLength={limitTextLength} textLength={text.length} /> : null}
				>
					{registrationRequired ? (
						<Button loading={loading} disabled={loading} onClick={onRegisterUser} stack>
							{t('chat_now')}
						</Button>
					) : (
						<Composer
							onUpload={onUpload}
							onSubmit={this.handleSubmit}
							onChange={this.handleChangeText}
							placeholder={t('type_your_message_here')}
							value={text}
							notifyEmojiSelect={(click: (native: string) => void) => {
								this.notifyEmojiSelect = click;
							}}
							handleEmojiClick={this.handleEmojiClick}
							pre={
								<ComposerActions>
									<ComposerAction
										text='Add emoji'
										className={createClassName(styles, 'emoji-picker-icon')}
										onClick={this.toggleEmojiPickerState}
									>
										<EmojiIcon width={20} height={20} />
									</ComposerAction>
								</ComposerActions>
							}
							post={
								<ComposerActions>
									{text.length === 0 && uploads && (
										<ComposerAction text='Add attachment' onClick={this.handleUploadClick}>
											<PlusIcon width={20} height={20} />
										</ComposerAction>
									)}
									{text.length > 0 && (
										<ComposerAction text='Send' onClick={this.handleSendClick}>
											<SendIcon width={20} height={20} />
										</ComposerAction>
									)}
								</ComposerActions>
							}
							limitTextLength={limitTextLength}
						/>
					)}
				</ScreenFooter>
			</FilesDropTarget>
		</Screen>
	);
}

export default withTranslation()(Chat);
