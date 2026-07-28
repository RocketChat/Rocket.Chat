import { useCallback, useContext, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { useTranslation } from 'react-i18next';

import ChatContainer from './container';
import { useChatSubscriptions } from './useChatSubscriptions';
import { Livechat } from '../../api';
import { ScreenContext } from '../../components/Screen/ScreenProvider';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import { loadMessages } from '../../lib/room';
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

	return (
		<ChatContainer
			innerStateRef={innerStateRef}
			inputRef={inputRef}
			notifyEmojiSelectRef={notifyEmojiSelectRef}
			t={t}
			title={title}
			sound={sound}
			token={token}
			user={user}
			agent={agent}
			room={room}
			messages={messages}
			uploads={uploads}
			typingUsernames={typingUsernames}
			loading={loading}
			connecting={connecting}
			dispatch={dispatch}
			departments={departments}
			allowSwitchingDepartments={allowSwitchingDepartments}
			conversationFinishedMessage={conversationFinishedMessage}
			allowRemoveUserData={allowRemoveUserData}
			alerts={alerts}
			unread={unread}
			lastReadMessageId={lastReadMessageId}
			guest={guest}
			queueInfo={queueInfo}
			registrationFormEnabled={registrationFormEnabled}
			nameFieldRegistrationForm={nameFieldRegistrationForm}
			emailFieldRegistrationForm={emailFieldRegistrationForm}
			limitTextLength={limitTextLength}
			theme={theme}
			visitorsCanCloseChat={visitorsCanCloseChat}
			onRegisterUser={onRegisterUser}
			handleChangeDepartment={handleChangeDepartment}
			checkRoom={checkRoom}
			grantUser={grantUser}
		/>
	);
};

export default Chat;
