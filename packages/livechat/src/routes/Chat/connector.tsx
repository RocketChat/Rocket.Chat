import { useCallback, useContext, useRef } from 'preact/hooks';
import { route } from 'preact-router';
import { useTranslation } from 'react-i18next';

import ChatContainer from './container';
import { useChatSubscriptions } from './useChatSubscriptions';
import { ScreenContext } from '../../components/Screen/ScreenProvider';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import { formatAgent } from '../../helpers/formatAgent';
import { type StoreState, useStore } from '../../store';

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
				registrationForm,
				nameFieldRegistrationForm,
				emailFieldRegistrationForm,
				limitTextLength,
				visitorsCanCloseChat,
			},
			messages: { conversationFinishedMessage },
			theme: { title = '' } = {},
			departments = [],
		},
		iframe: { theme: { title: customTitle = '' } = {}, guest = {} },
		token,
		agent,
		sound,
		user,
		room,
		messages,
		noMoreMessages,
		typing,
		loading,
		dispatch,
		alerts,
		visible,
		unread,
		lastReadMessageId,
		triggerAgent,
		queueInfo,
		messageListPosition,
	} = useStore();

	const { t } = useTranslation();

	useChatSubscriptions();

	const onRegisterUser = useCallback(() => {
		route('/register');
	}, []);

	const onChangeDepartment = useCallback(() => {
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

	return (
		<ChatContainer
			innerStateRef={innerStateRef}
			inputRef={inputRef}
			notifyEmojiSelectRef={notifyEmojiSelectRef}
			t={t}
			title={customTitle || title || t('need_help')}
			sound={sound}
			token={token}
			user={user}
			agent={formatAgent(agent)}
			room={room}
			messages={messages?.filter(canRenderMessage)}
			noMoreMessages={noMoreMessages}
			emoji={true}
			uploads={uploads}
			typingUsernames={Array.isArray(typing) ? typing : []}
			loading={loading}
			showConnecting={showConnecting} // setting from server that tells if app needs to show "connecting" sometimes
			connecting={!!(room && !agent && (showConnecting || queueInfo))}
			dispatch={dispatch}
			departments={departments}
			allowSwitchingDepartments={allowSwitchingDepartments}
			conversationFinishedMessage={conversationFinishedMessage || t('conversation_finished')}
			allowRemoveUserData={allowRemoveUserData}
			alerts={alerts}
			visible={visible}
			unread={unread}
			lastReadMessageId={lastReadMessageId}
			guest={guest}
			triggerAgent={triggerAgent}
			queueInfo={
				queueInfo
					? {
							spot: queueInfo.spot,
							estimatedWaitTimeSeconds: queueInfo.estimatedWaitTimeSeconds,
							message: queueInfo.message,
						}
					: undefined
			}
			registrationFormEnabled={registrationForm}
			nameFieldRegistrationForm={nameFieldRegistrationForm}
			emailFieldRegistrationForm={emailFieldRegistrationForm}
			limitTextLength={limitTextLength}
			messageListPosition={messageListPosition}
			theme={theme}
			visitorsCanCloseChat={visitorsCanCloseChat}
			onRegisterUser={onRegisterUser}
			handleChangeDepartment={onChangeDepartment}
		/>
	);
};

export default Chat;
