import type { TFunction } from 'i18next';
import type { Ref } from 'preact';
import { useContext } from 'preact/hooks';
import { withTranslation } from 'react-i18next';

import { ChatContainer } from '.';
import { ScreenContext } from '../../components/Screen/ScreenProvider';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import { formatAgent } from '../../helpers/formatAgent';
import { StoreContext } from '../../store';

type ChatConnectorProps = {
	path: string;
	default: boolean;
	t: TFunction;
	ref?: Ref<any>;
};

export const ChatConnector = ({ ref, t }: ChatConnectorProps) => {
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
			departments = {},
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
	} = useContext(StoreContext);

	return (
		<ChatContainer
			ref={ref}
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
		/>
	);
};

export default withTranslation()(ChatConnector);
