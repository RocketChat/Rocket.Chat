import type { EmojiData } from 'emoji-mart';
import { Suspense } from 'preact/compat';
import { useCallback, useContext, useMemo, useRef, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { useTranslation } from 'react-i18next';

import Picker from './Picker';
import ChatContainer from './container';
import styles from './styles.scss';
import { useChatSubscriptions } from './useChatSubscriptions';
import { Livechat } from '../../api';
import { Button } from '../../components/Button';
import { Composer, ComposerAction, ComposerActions } from '../../components/Composer';
import { FilesDropTarget } from '../../components/FilesDropTarget';
import { FooterOptions, CharCounter } from '../../components/Footer';
import { MenuGroup, MenuItem } from '../../components/Menu';
import { MessageList } from '../../components/Messages';
import { ModalManager } from '../../components/Modal';
import { Screen, ScreenContent, ScreenFooter } from '../../components/Screen';
import { ScreenContext } from '../../components/Screen/ScreenProvider';
import { getAvatarUrl } from '../../helpers/baseUrl';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import { createClassName } from '../../helpers/createClassName';
import { debounce } from '../../helpers/debounce';
import { formatAgent } from '../../helpers/formatAgent';
import { throttle } from '../../helpers/throttle';
import { upsert } from '../../helpers/upsert';
import ChangeIcon from '../../icons/change.svg';
import FinishIcon from '../../icons/finish.svg';
import PlusIcon from '../../icons/plus.svg';
import RemoveIcon from '../../icons/remove.svg';
import SendIcon from '../../icons/send.svg';
import EmojiIcon from '../../icons/smile.svg';
import { normalizeQueueAlert } from '../../lib/api';
import constants from '../../lib/constants';
import { loadConfig } from '../../lib/main';
import { parentCall, runCallbackEventEmitter } from '../../lib/parentCall';
import { createToken } from '../../lib/random';
import { defaultRoomParams, getGreetingMessages, initRoom, loadMessages, loadMoreMessages } from '../../lib/room';
import { type StoreState, useStore } from '../../store';

const useStableCallback = <TFunction extends (...args: any[]) => any>(callback: TFunction): TFunction => {
	const callbackRef = useRef<TFunction>(callback);

	callbackRef.current = callback;

	return useCallback(((...args) => callbackRef.current(...args)) as TFunction, []);
};

const useChatTitle = () => {
	const {
		config: { theme: { title = '' } = {} },
		iframe: { theme: { title: customTitle = '' } = {} },
	} = useStore();

	return customTitle || title;
};

const startTyping = throttle(async ({ rid, username }: { rid: string; username: string }) => {
	await Livechat.notifyVisitorActivity(rid, username, ['user-typing']);
	stopTypingDebounced({ rid, username });
}, 4500);

const stopTyping = ({ rid, username }: { rid: string; username: string }) => Livechat.notifyVisitorActivity(rid, username, []);

const stopTypingDebounced = debounce(stopTyping, 5000);

export type ChatProps = {
	path?: string;
	default?: boolean;
};

const Chat = (_: ChatProps) => {
	const { theme } = useContext(ScreenContext);
	const {
		config: {
			settings: {
				fileUpload: uploads,
				allowSwitchingDepartments,
				forceAcceptDataProcessingConsent: allowRemoveUserData,
				showConnecting,
				registrationForm: registrationFormEnabled,
				nameFieldRegistrationForm,
				emailFieldRegistrationForm,
				limitTextLength,
				visitorsCanCloseChat,
			},
			departments = [],
		},
		iframe: { guest = {}, defaultDepartment },
		token,
		agent,
		sound,
		user,
		room,
		typing,
		loading,
		dispatch,
		alerts,
		unread,
		lastReadMessageId,
		queueInfo,
	} = useStore();

	const { t } = useTranslation();

	useChatSubscriptions();

	const onRegisterUser = useCallback(() => {
		route('/register');
	}, []);

	const handleChangeDepartment = useCallback(() => {
		route('/switch-department');
	}, []);

	const innerStateRef = useRef<{
		room: StoreState['room'] | null;
		connectingAgent: boolean;
		queueSpot: number;
		triggerQueueMessage: boolean;
		estimatedWaitTime: number | null | undefined;
	}>({
		room: null,
		connectingAgent: false,
		queueSpot: 0,
		triggerQueueMessage: true,
		estimatedWaitTime: null,
	});

	const inputRef = useRef<HTMLInputElement>(null);
	const notifyEmojiSelectRef = useRef<(native: string) => void>();
	const title = useChatTitle() || t('need_help');
	const messages = useStore().messages?.filter(canRenderMessage);
	const typingUsernames = Array.isArray(typing) ? typing : [];
	const connecting = !!(room && !agent && (showConnecting || queueInfo));
	const conversationFinishedMessage = useStore().config.messages.conversationFinishedMessage || t('conversation_finished');

	const checkRoom = useStableCallback(() => {
		const { room: stateRoom } = innerStateRef.current;
		if (room && room._id !== stateRoom?._id) {
			innerStateRef.current.room = room;
			setTimeout(loadMessages, 500);
		}
	});

	const grantUser = useStableCallback(async () => {
		if (user) {
			return;
		}

		if (!guest?.department && defaultDepartment && guest) {
			guest.department = defaultDepartment;
		}

		const visitor = { token, ...guest };
		const { visitor: newUser } = await Livechat.grantVisitor({ visitor });
		dispatch({ user: newUser });
	});

	const getRoom = useStableCallback(async () => {
		const previousMessages = getGreetingMessages(messages);

		if (room) {
			return room;
		}

		dispatch({ loading: true });
		try {
			const params = defaultRoomParams();
			const newRoom = await Livechat.room(params as Parameters<typeof Livechat.room>[0]);
			dispatch({ room: newRoom, messages: previousMessages, noMoreMessages: false });
			await initRoom();

			parentCall('callback', 'chat-started');
			return newRoom;
		} catch (error: any) {
			const reason = error ? error.error : '';
			const alert = {
				id: createToken(),
				children: t('error_starting_a_new_conversation_reason', { reason }),
				error: true,
				timeout: 10000,
			};
			dispatch({ loading: false, alerts: (alerts.push(alert), alerts) });

			runCallbackEventEmitter(reason, undefined);
			throw error;
		} finally {
			dispatch({ loading: false });
		}
	});

	const onTop = useCallback(() => {
		void loadMoreMessages();
	}, []);

	const onChangeText = useStableCallback(async () => {
		if (!(user?.username && room?._id)) {
			return;
		}

		startTyping({ rid: room._id, username: user.username });
	});

	const onSubmit = useStableCallback(async (msg: string) => {
		if (msg.trim() === '') {
			return;
		}

		await grantUser();
		const { _id: rid } = await getRoom();

		try {
			stopTypingDebounced.stop();
			await Promise.all([stopTyping({ rid, username: user?.username ?? '' }), Livechat.sendMessage({ msg, token, rid })]);
		} catch (error: any) {
			const reason = error?.error ?? error.message;
			const alert = { id: createToken(), children: reason, error: true, timeout: 5000 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		}
		await Livechat.notifyVisitorActivity(rid, user?.username ?? '', []);
	});

	const doFileUpload = useStableCallback(async (rid: string, file: File) => {
		try {
			await Livechat.uploadFile(rid, file);
		} catch (error: any) {
			const {
				data: { reason, sizeAllowed },
			} = error;

			let message = t('fileupload_error');
			switch (reason) {
				case 'error-type-not-allowed':
					message = t('media_types_not_accepted');
					break;
				case 'error-size-not-allowed':
					message = t('file_exceeds_allowed_size_of_size', { size: sizeAllowed });
			}

			const alert = { id: createToken(), children: message, error: true, timeout: 5000 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		}
	});

	const onUpload = useStableCallback(async (files: (File | null)[]) => {
		if (!uploads) {
			const alert = { id: createToken(), children: t('file_upload_disabled'), error: true, timeout: 5000 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
			return;
		}

		await grantUser();
		const { _id: rid } = await getRoom();

		files.forEach((file) => {
			if (file) {
				void doFileUpload(rid, file);
			}
		});
	});

	const onSoundStop = useStableCallback(async () => {
		dispatch({ sound: { ...sound, play: false } });
	});

	const handleFinishChat = useStableCallback(async () => {
		const { success } = await ModalManager.confirm({
			text: t('are_you_sure_you_want_to_finish_this_chat'),
		});

		if (!success) {
			return;
		}

		const { _id: rid } = room || {};

		dispatch({ loading: true });
		try {
			if (!rid) {
				throw new Error('error-room-not-found');
			}

			await Livechat.closeChat({ rid });
		} catch (error) {
			console.error(error);
			const alert = { id: createToken(), children: t('error_closing_chat'), error: true, timeout: 0 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		} finally {
			dispatch({ loading: false });
		}
	});

	const handleRemoveUserData = useStableCallback(async () => {
		const { success } = await ModalManager.confirm({
			text: t('are_you_sure_you_want_to_remove_all_of_your_person'),
		});

		if (!success) {
			return;
		}

		dispatch({ loading: true });
		try {
			await Livechat.deleteVisitor();
		} catch (error) {
			console.error(error);
			const alert = { id: createToken(), children: t('error_removing_user_data'), error: true, timeout: 0 };
			dispatch({ alerts: (alerts.push(alert), alerts) });
		} finally {
			await loadConfig();
			dispatch({ loading: false });
			route('/chat-finished');
		}
	});

	const canSwitchDepartment = useMemo(
		() => !!allowSwitchingDepartments && departments.filter((dept) => dept.showOnRegistration).length > 1,
		[allowSwitchingDepartments, departments],
	);

	const canFinishChat = !!visitorsCanCloseChat && (room?._id !== undefined || !!connecting);

	const canRemoveUserData = !!allowRemoveUserData;

	const handleConnectingAgentAlert = useStableCallback(async (connecting: boolean, message?: string | false) => {
		const { connectingAgentAlertId } = constants;
		const newAlerts = alerts.filter((item) => item.id !== connectingAgentAlertId);
		if (connecting) {
			newAlerts.push({
				id: connectingAgentAlertId,
				children: message || t('please_wait_for_the_next_available_agent'),
				warning: true,
				hideCloseButton: true,
				timeout: 0,
			});
		}

		dispatch({ alerts: newAlerts });
	});

	const handleQueueMessage = useStableCallback(async (connecting: boolean, queueInfo?: StoreState['queueInfo']) => {
		if (!queueInfo) return;

		const { livechatQueueMessageId } = constants;
		const { message: { text: msg, user: u } = {} } = queueInfo;
		const { triggerQueueMessage } = innerStateRef.current;

		if (!room || !connecting || !msg || !triggerQueueMessage) {
			return;
		}

		innerStateRef.current.triggerQueueMessage = false;

		const ts = new Date();
		const message = { _id: livechatQueueMessageId, msg, u, ts: ts.toISOString() };
		dispatch({
			messages: upsert(
				messages,
				message,
				({ _id }) => _id === message._id,
				({ ts }) => ts,
			),
		});
	});

	const checkConnectingAgent = useStableCallback(async () => {
		const { connectingAgent, queueSpot, estimatedWaitTime } = innerStateRef.current;

		const newConnecting = !!connecting;
		const newQueueSpot = queueInfo?.spot || 0;
		const newEstimatedWaitTime = queueInfo?.estimatedWaitTimeSeconds;

		if (newConnecting !== connectingAgent || newQueueSpot !== queueSpot || newEstimatedWaitTime !== estimatedWaitTime) {
			innerStateRef.current.connectingAgent = newConnecting;
			innerStateRef.current.queueSpot = newQueueSpot;
			innerStateRef.current.estimatedWaitTime = newEstimatedWaitTime;
			await handleQueueMessage(newConnecting, queueInfo);
			await handleConnectingAgentAlert(newConnecting, await normalizeQueueAlert(queueInfo));
		}
	});

	const avatarResolver = getAvatarUrl;

	const uid = user?._id;

	const options = canSwitchDepartment || canFinishChat || canRemoveUserData;

	const onChangeDepartment = canSwitchDepartment ? handleChangeDepartment : undefined;
	const onFinishChat = canFinishChat ? handleFinishChat : undefined;
	const onRemoveUserData = canRemoveUserData ? handleRemoveUserData : undefined;

	const registrationRequired = useMemo(() => {
		if (user?.token) {
			return false;
		}

		if (!registrationFormEnabled) {
			return false;
		}

		const showDepartment = departments.filter((dept) => dept.showOnRegistration).length > 0;
		return !!(nameFieldRegistrationForm || emailFieldRegistrationForm || showDepartment);
	}, [user?.token, registrationFormEnabled, departments, nameFieldRegistrationForm, emailFieldRegistrationForm]);

	const [atBottom, setAtBottom] = useState(true);
	const [text, setText] = useState('');
	const [emojiPickerActive, setEmojiPickerActive] = useState(false);

	const handleScrollTo = useStableCallback((region: string) => {
		if (region === MessageList.SCROLL_AT_BOTTOM) {
			setAtBottom(true);
			return;
		}

		setAtBottom(false);

		if (region === MessageList.SCROLL_AT_TOP) {
			onTop?.();
		}
	});

	const handleUploadClick = useStableCallback((event?: Event) => {
		event?.preventDefault();
		inputRef.current?.click();
	});

	const handleSubmit = useStableCallback((text: string) => {
		void onSubmit(text);
		setText('');
		setEmojiPickerActive(false);
	});

	const handleSendClick = useStableCallback((event?: Event) => {
		event?.preventDefault();
		handleSubmit(text);
	});

	const handleChangeText = useStableCallback((text: string) => {
		let value = text;
		if (limitTextLength && limitTextLength < text.length) {
			value = value.substring(0, limitTextLength);
		}
		setText(value);
		void onChangeText?.();
	});

	const toggleEmojiPickerState = useStableCallback(() => {
		setEmojiPickerActive((emojiPickerActive) => !emojiPickerActive);
	});

	const handleEmojiSelect = useStableCallback((emoji: EmojiData) => {
		toggleEmojiPickerState();
		if ('native' in emoji) {
			notifyEmojiSelectRef.current?.(emoji.native);
		}
	});

	const handleEmojiClick = useStableCallback(() => {
		setEmojiPickerActive(false);
	});

	return (
		<>
			<ChatContainer
				user={user}
				messages={messages}
				dispatch={dispatch}
				alerts={alerts}
				checkRoom={checkRoom}
				handleConnectingAgentAlert={handleConnectingAgentAlert}
				checkConnectingAgent={checkConnectingAgent}
			/>
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
		</>
	);
};

export default Chat;
