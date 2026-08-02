import { Component, createRef } from 'preact';
import { Suspense, lazy } from 'preact/compat';
import { withTranslation } from 'react-i18next';

import styles from './styles.scss';
import { Button } from '../../components/Button';
import { CallIframe } from '../../components/Calls/CallIFrame';
import { default as CallNotification } from '../../components/Calls/CallNotification';
import { CallStatus } from '../../components/Calls/CallStatus';
import { Composer, ComposerAction, ComposerActions } from '../../components/Composer';
import { FilesDropTarget } from '../../components/FilesDropTarget';
import { FooterOptions, CharCounter } from '../../components/Footer';
import { Menu } from '../../components/Menu';
import { MessageList } from '../../components/Messages';
import { Screen } from '../../components/Screen';
import { createClassName } from '../../helpers/createClassName';
import ChangeIcon from '../../icons/change.svg';
import FinishIcon from '../../icons/finish.svg';
import SendIcon from '../../icons/send.svg';
import RemoveIcon from '../../icons/remove.svg';
import AttachmentIcon from '../../icons/attachment.svg';
import EmojiIcon from '../../icons/smile.svg';
import { WelcomeScreen } from './WelcomeScreen'
import store from "../../store";

import 'emoji-mart/css/emoji-mart.css';
import { parse } from 'query-string';

const Picker = lazy(async () => {
	const { Picker } = await import('emoji-mart');
	return Picker;
});

const host =
	window.SERVER_URL ?? parse(window.location.search).serverUrl ?? (process.env.NODE_ENV === 'development' ? 'https://chatbot-stg.charisma.digital' : null);

class Chat extends Component {
	state = {
		atBottom: true,
		text: '',
		emojiPickerActive: false,
		showFeedback: false,
		hoveredStar: 0,
		selectedRating: 0,
	};

	inputRef = createRef(null);

	handleFilesDropTargetRef = (ref) => {
		this.filesDropTarget = ref;
	};

	handleMessagesContainerRef = (messagesContainer) => {
		this.messagesContainer = messagesContainer ? messagesContainer.base : null;
	};

	handleScrollTo = (region) => {
		const { onTop, onBottom } = this.props;

		if (region === MessageList.SCROLL_AT_BOTTOM) {
			this.setState({ atBottom: true });
			onBottom && onBottom();
			return;
		}

		this.setState({ atBottom: false });

		if (region === MessageList.SCROLL_AT_TOP) {
			onTop && onTop();
		}
	};

	handleUploadClick = (event) => {
		event.preventDefault();
		this.inputRef?.current?.click();
	};

	handleSendClick = (event) => {
		event.preventDefault();
		this.handleSubmit(this.state.text);
	};

	handleSubmit = (text) => {
		if (this.props.onSubmit) {
			this.props.onSubmit(text);
			this.setState({ text: '' });
			this.turnOffEmojiPicker();
		}
	};

	handleChangeText = (text) => {
		let value = text;
		const { onChangeText, limitTextLength } = this.props;
		if (limitTextLength && limitTextLength < text.length) {
			value = value.substring(0, limitTextLength);
		}
		this.setState({ text: value });
		onChangeText && onChangeText(value);
	};

	toggleEmojiPickerState = () => {
		this.setState({ emojiPickerActive: !this.state.emojiPickerActive });
	};

	handleEmojiSelect = (emoji) => {
		this.toggleEmojiPickerState();
		this.notifyEmojiSelect(emoji.native);
	};

	handleEmojiClick = () => {
		this.turnOffEmojiPicker();
	};

	turnOffEmojiPicker = () => {
		if (this.state.emojiPickerActive) {
			this.setState({ emojiPickerActive: !this.state.emojiPickerActive });
		}
	};



	handleFeedback = (rating) => {
		this.sendFeedbackToServer(rating);
		this.setState({ showFeedback: false });
	};

	sendFeedbackToServer = (rating) => {
		const { user: _id, token, user } = store.state;
		const { room } = this.props;

		fetch(`${host}/api/v1/livechat/room.survey`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				rid: room._id,
				token, // visitor token
				data: [
					{
						name: "additionalFeedback",
						value: `Feedback from userId: ${_id}`,
					},
					{
						name: "rating",
						value: rating,
					},
				],
			}),
		})
			.then((res) => console.log("feedback res", res))
			.catch((err) => console.log("feedback err", err));
	};

	// onForwardToCrm = () => {
	// 	const { user: _id, token } = store.state;
	// 	const { room } = this.props;
	// 	fetch(
	// 		`${host}/api/v1/forward_room_to_crm?room_id=${room._id}&user_token=${token}`,
	// 		{
	// 			method: "POST",
	// 			headers: {
	// 				"Content-Type": "application/json",
	// 			},
	// 		}
	// 	)
	// 		.then((res) => console.log("forward_room_to_crm res", res))
	// 		.catch((err) => console.log("forward_room_to_crm err", err));
	// };

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
			incomingCallAlert,
			ongoingCall,
			dispatch,
			theme,
			...props
		},
		{ atBottom = true, text },
	) => (
		<Screen
			title={title || t('need_help')}
			agent={agent || null}
			queueInfo={queueInfo}
			nopadding
			onChangeDepartment={onChangeDepartment}
			onFinishChat={onFinishChat}
			onRemoveUserData={onRemoveUserData}
			className={createClassName(styles, 'chat')}
			handleEmojiClick={this.handleEmojiClick}
			theme={theme}
			onSupportClick={() => this.handleSubmit(t('support'))}
			{...props}
		>
			<FilesDropTarget inputRef={this.inputRef} overlayed overlayText={t('drop_here_to_upload_a_file')} onUpload={onUpload}>
				<Screen.Content nopadding>
					{incomingCallAlert && !!incomingCallAlert.show && <CallNotification {...incomingCallAlert} dispatch={dispatch} />}
					{incomingCallAlert?.show && ongoingCall && ongoingCall.callStatus === CallStatus.IN_PROGRESS_SAME_TAB ? (
						<CallIframe {...incomingCallAlert} />
					) : null}
					{messages.length === 0 && <WelcomeScreen onSelectSuggestion={this.handleSubmit} />}
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
				</Screen.Content>


				<Screen.Footer
					options={
						options && !registrationRequired ? (
							<FooterOptions>
								<Menu.Group>
									{onChangeDepartment && (
										<Menu.Item onClick={onChangeDepartment} icon={ChangeIcon}>
											{t('change_department')}
										</Menu.Item>
									)}
									{onRemoveUserData && (
										<Menu.Item onClick={onRemoveUserData} icon={RemoveIcon}>
											{t('forget_remove_my_data')}
										</Menu.Item>
									)}
									{onFinishChat && (
										<Menu.Item danger onClick={onFinishChat} icon={FinishIcon}>
											{t('finish_this_chat')}
										</Menu.Item>
									)}
								</Menu.Group>
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
							placeholder={'پیام خود را بنویسید ...'}
							value={text}
							notifyEmojiSelect={(click) => {
								this.notifyEmojiSelect = click;
							}}
							inputLock={typingUsernames && typingUsernames.length ? true : false}
							handleEmojiClick={this.handleEmojiClick}
							pre={
								<ComposerActions>
									<ComposerAction onClick={this.handleUploadClick} ghost>
										<AttachmentIcon width={24} height={24} />
									</ComposerAction>
								</ComposerActions>
							}
							post={
								<ComposerAction onClick={this.handleSendClick} disabled={text.length === 0 || loading} >
									<SendIcon width={24} height={24} />
								</ComposerAction>

							}
							limitTextLength={limitTextLength}
						/>
					)}
				</Screen.Footer>
			</FilesDropTarget>
		</Screen>
	);
}

export default withTranslation()(Chat);
