import type { EmojiData } from 'emoji-mart';
import type { TFunction } from 'i18next';
import type { RefObject } from 'preact';
import { Component } from 'preact';
import { Suspense } from 'preact/compat';
import type { MutableRef, StateUpdater, Dispatch as StoreDispatch } from 'preact/hooks';

import Picker from './Picker';
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
import { formatAgent } from '../../helpers/formatAgent';
import ChangeIcon from '../../icons/change.svg';
import FinishIcon from '../../icons/finish.svg';
import PlusIcon from '../../icons/plus.svg';
import RemoveIcon from '../../icons/remove.svg';
import SendIcon from '../../icons/send.svg';
import EmojiIcon from '../../icons/smile.svg';
import type { Dispatch, StoreState } from '../../store';

export type ChatProps = {
	inputRef: RefObject<HTMLInputElement>;
	notifyEmojiSelectRef: MutableRef<((native: string) => void) | undefined>;
	title?: string;
	uid?: string;
	agent?: StoreState['agent'];
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
	queueInfo?: StoreState['queueInfo'];
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
	atBottom: boolean;
	text: string;
	emojiPickerActive: boolean;
	setAtBottom: StoreDispatch<StateUpdater<boolean>>;
	setText: StoreDispatch<StateUpdater<string>>;
	setEmojiPickerActive: StoreDispatch<StateUpdater<boolean>>;
	handleScrollTo: (region: string) => void;
	handleUploadClick: (event?: Event) => void;
	handleSubmit: (text: string) => void;
	handleSendClick: (event?: Event) => void;
	handleChangeText: (text: string) => void;
	toggleEmojiPickerState: () => void;
};

class Chat extends Component<ChatProps> {
	private handleEmojiSelect = (emoji: EmojiData) => {
		const { notifyEmojiSelectRef, toggleEmojiPickerState } = this.props;

		toggleEmojiPickerState();
		if ('native' in emoji) {
			notifyEmojiSelectRef.current?.(emoji.native);
		}
	};

	private handleEmojiClick = () => {
		const { setEmojiPickerActive } = this.props;
		setEmojiPickerActive(false);
	};

	render = ({
		inputRef,
		notifyEmojiSelectRef,
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
		t = ((key: string) => key) as TFunction,
		dispatch,
		theme,
		unread,
		onSoundStop,
		atBottom,
		text,
		emojiPickerActive,
		handleScrollTo,
		handleUploadClick,
		handleSubmit,
		handleChangeText,
		handleSendClick,
		toggleEmojiPickerState,
	}: ChatProps) => {
		const {
			handleEmojiClick,

			handleEmojiSelect,
		} = this;

		return (
			<Screen
				title={title || t('need_help')}
				agent={formatAgent(agent)}
				queueInfo={queueInfo}
				className={createClassName(styles, 'chat')}
				unread={unread}
				onSoundStop={onSoundStop}
			>
				<FilesDropTarget inputRef={inputRef} overlayed overlayText={t('drop_here_to_upload_a_file')} onUpload={onUpload}>
					<ScreenContent nopadding>
						<div className={createClassName(styles, 'chat__messages', { atBottom, loading })}>
							<MessageList
								avatarResolver={avatarResolver}
								uid={uid}
								messages={messages}
								typingUsernames={typingUsernames}
								conversationFinishedMessage={conversationFinishedMessage}
								lastReadMessageId={lastReadMessageId}
								handleEmojiClick={handleEmojiClick}
								dispatch={dispatch}
								hideSenderAvatar={theme?.hideGuestAvatar}
								hideReceiverAvatar={theme?.hideAgentAvatar}
								onScrollTo={handleScrollTo}
							/>
							{emojiPickerActive && (
								<Suspense fallback={null}>
									<Picker
										style={{ position: 'absolute', zIndex: 10, bottom: 0, maxWidth: '90%', left: 20, maxHeight: '90%' }}
										showPreview={false}
										showSkinTones={false}
										sheetSize={64}
										onSelect={handleEmojiSelect}
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
								onSubmit={handleSubmit}
								onChange={handleChangeText}
								placeholder={t('type_your_message_here')}
								value={text}
								notifyEmojiSelect={(click: (native: string) => void) => {
									notifyEmojiSelectRef.current = click;
								}}
								handleEmojiClick={handleEmojiClick}
								pre={
									<ComposerActions>
										<ComposerAction
											text='Add emoji'
											className={createClassName(styles, 'emoji-picker-icon')}
											onClick={toggleEmojiPickerState}
										>
											<EmojiIcon width={20} height={20} />
										</ComposerAction>
									</ComposerActions>
								}
								post={
									<ComposerActions>
										{text.length === 0 && uploads && (
											<ComposerAction text='Add attachment' onClick={handleUploadClick}>
												<PlusIcon width={20} height={20} />
											</ComposerAction>
										)}
										{text.length > 0 && (
											<ComposerAction text='Send' onClick={handleSendClick}>
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
	};
}

export default Chat;
