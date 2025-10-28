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
import PlusIcon from '../../icons/plus.svg';
import RemoveIcon from '../../icons/remove.svg';
import SendIcon from '../../icons/send.svg';
import EmojiIcon from '../../icons/smile.svg';

import store from "../../store";

import 'emoji-mart/css/emoji-mart.css';

const Picker = lazy(async () => {
	const { Picker } = await import('emoji-mart');
	return Picker;
});

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

	onForwardToCrm = () => {
		const { user: _id, token } = store.state;
		const { room } = this.props;
		fetch(
			`${host}/api/v1/forward_room_to_crm?room_id=${room._id}&user_token=${token}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			}
		)
			.then((res) => console.log("forward_room_to_crm res", res))
			.catch((err) => console.log("forward_room_to_crm err", err));
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
			{...props}
		>
			<FilesDropTarget inputRef={this.inputRef} overlayed overlayText={t('drop_here_to_upload_a_file')} onUpload={onUpload}>
				<Screen.Content nopadding>
					{incomingCallAlert && !!incomingCallAlert.show && <CallNotification {...incomingCallAlert} dispatch={dispatch} />}
					{incomingCallAlert?.show && ongoingCall && ongoingCall.callStatus === CallStatus.IN_PROGRESS_SAME_TAB ? (
						<CallIframe {...incomingCallAlert} />
					) : null}
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
				{this.state.showFeedback && (
					<div className={createClassName(styles, "modal-overlay")}>
						<div className={createClassName(styles, "modal-content")}>
							<button
								className={createClassName(styles, "close-button")}
								onClick={() => this.setState({ showFeedback: false })}
							>
								×
							</button>
							<h3>از چت راضی بودی؟</h3>
							<p>لطفاً به تجربه‌ی خودت امتیاز بده:</p>
							<div className={createClassName(styles, "stars")}>
								{[1, 2, 3, 4, 5].map((star) => (
									<span
										key={star}
										style={{
											cursor: "pointer",
											fontSize: "32px",
											color:
												(this.state.hoveredStar || this.state.selectedRating) >=
													star
													? "#ffc107"
													: "#ccc",
										}}
										onMouseEnter={() => this.setState({ hoveredStar: star })}
										onMouseLeave={() => this.setState({ hoveredStar: 0 })}
										onClick={() => {
											this.setState({ selectedRating: star });
											setTimeout(() => {
												this.handleFeedback(star);
												this.setState({ showFeedback: false });
											}, 1000);
										}}
									>
										★
									</span>
								))}
							</div>
						</div>
					</div>
				)}
				<div
					style={{
						display: "flex",
						width: "100%",
						justifyContent: "space-between",
						alignItems: "center",
						padding: "20px 20px 0px",
						fontSize: "0.8rem",
						color: "#455098",
						height: "30px",
					}}
				>
					<span
						style={{
							cursor: "pointer",
							display: "flex",
							gap: "10px",
							height: "30px",
						}}
						onClick={() => {
							this.setState({ showFeedback: true });
						}}
					>
						<div
							style={{
								width: "20px",
								height: "230px",
							}}
						>
							<svg
								fill="#455098"
								width="20px"
								height="20px"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path d="M22,1H15a2.44,2.44,0,0,0-2.41,2l-.92,5.05a2.44,2.44,0,0,0,.53,2,2.47,2.47,0,0,0,1.88.88H17l-.25.66A3.26,3.26,0,0,0,19.75,16a1,1,0,0,0,.92-.59l2.24-5.06A1,1,0,0,0,23,10V2A1,1,0,0,0,22,1ZM21,9.73l-1.83,4.13a1.33,1.33,0,0,1-.45-.4,1.23,1.23,0,0,1-.14-1.16l.38-1a1.68,1.68,0,0,0-.2-1.58A1.7,1.7,0,0,0,17.35,9H14.06a.46.46,0,0,1-.35-.16.5.5,0,0,1-.09-.37l.92-5A.44.44,0,0,1,15,3h6ZM9.94,13.05H7.05l.25-.66A3.26,3.26,0,0,0,4.25,8a1,1,0,0,0-.92.59L1.09,13.65a1,1,0,0,0-.09.4v8a1,1,0,0,0,1,1H9a2.44,2.44,0,0,0,2.41-2l.92-5a2.44,2.44,0,0,0-.53-2A2.47,2.47,0,0,0,9.94,13.05Zm-.48,7.58A.44.44,0,0,1,9,21H3V14.27l1.83-4.13a1.33,1.33,0,0,1,.45.4,1.23,1.23,0,0,1,.14,1.16l-.38,1a1.68,1.68,0,0,0,.2,1.58,1.7,1.7,0,0,0,1.41.74H9.94a.46.46,0,0,1,.35.16.5.5,0,0,1,.09.37Z" />
							</svg>
						</div>
						ثبت بازخورد
					</span>
					{this.props?.room?.servedBy?.username === "bot" && (
						<span
							onClick={this.onForwardToCrm}
							style={{
								cursor: "pointer",
								display: "flex",
								gap: "10px",
								height: "30px",
							}}
						>
							ارتباط با پشتیبانی
							<div
								style={{
									width: "20px",
									height: "230px",
								}}
							>
								<svg
									fill="#455098"
									height="20px"
									width="20px"
									version="1.1"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 408.352 408.352"
									enable-background="new 0 0 408.352 408.352"
								>
									<path d="m408.346,163.059c0-71.92-54.61-131.589-125.445-138.512-2.565-8.81-10.698-15.272-20.325-15.272h-116.801c-9.627,0-17.759,6.462-20.324,15.272-70.837,6.932-125.451,66.602-125.451,138.512v111.142c0,23.601 19.201,42.802 42.801,42.802h33.32c9.916,0 17.983-8.067 17.983-17.983v-118.102c0-9.916-8.067-17.983-17.983-17.983h-33.32c-10.606,0-20.316,3.886-27.801,10.298v-10.174c-1.06581e-14-64.07 48.585-117.252 111.653-123.559 3.401,7.16 10.682,12.134 19.122,12.134h116.801c8.44,0 15.721-4.974 19.123-12.134 63.065,6.299 111.647,59.481 111.647,123.56v10.169c-7.485-6.409-17.193-10.294-27.796-10.294h-33.32c-9.916,0-17.983,8.067-17.983,17.983v118.101c0,9.916 8.067,17.983 17.983,17.983h33.32c10.606,0 20.316-3.886 27.802-10.299v5.459c0,28.339-23.056,51.395-51.395,51.395h-90.885c-3.288-11.818-14.14-20.518-26.991-20.518h-27.357c-15.449,0-28.018,12.569-28.018,28.018s12.569,28.018 28.018,28.018h27.357c12.851,0 23.703-8.7 26.991-20.518h90.885c36.61,0 66.395-29.784 66.395-66.395l-.006-149.103zm-329.241,17.859v118.101c-1.42109e-14,1.645-1.338,2.983-2.983,2.983h-2.983v-124.067h2.983c1.645,0 2.983,1.338 2.983,2.983zm-36.304-2.983h15.337v124.068h-15.337c-15.33,0-27.801-12.472-27.801-27.802v-68.465c-3.55271e-15-15.33 12.472-27.801 27.801-27.801zm219.775-141.302h-116.801c-3.407-7.10543e-15-6.179-2.772-6.179-6.179s2.772-6.179 6.179-6.179h116.801c3.407,0 6.18,2.772 6.18,6.179s-2.773,6.179-6.18,6.179zm66.67,262.386v-118.101c0-1.645 1.338-2.983 2.983-2.983h2.983v124.068h-2.983c-1.645,0-2.983-1.339-2.983-2.984zm-105.165,85.057h-27.357c-7.178,0-13.018-5.84-13.018-13.018s5.84-13.018 13.018-13.018h27.357c7.179,0 13.019,5.84 13.019,13.018s-5.84,13.018-13.019,13.018zm141.469-82.073h-15.337v-124.068h15.337c15.33,0 27.802,12.472 27.802,27.801v68.465c-5.68434e-14,15.33-12.472,27.802-27.802,27.802z" />
								</svg>
							</div>
						</span>
					)}
				</div>


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
							placeholder={t('type_your_message_here')}
							value={text}
							notifyEmojiSelect={(click) => {
								this.notifyEmojiSelect = click;
							}}
							handleEmojiClick={this.handleEmojiClick}
							pre={
								<ComposerActions>
									<ComposerAction className={createClassName(styles, 'emoji-picker-icon')} onClick={this.toggleEmojiPickerState}>
										<EmojiIcon width={20} height={20} />
									</ComposerAction>
								</ComposerActions>
							}
							post={
								<ComposerActions>
									{text.length === 0 && uploads && (
										<ComposerAction onClick={this.handleUploadClick}>
											<PlusIcon width={20} height={20} />
										</ComposerAction>
									)}
									{text.length > 0 && (
										<ComposerAction onClick={this.handleSendClick} disabled={typingUsernames && typingUsernames.length} >
											<SendIcon width={20} height={20} />
										</ComposerAction>
									)}
								</ComposerActions>
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
