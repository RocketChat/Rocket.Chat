import type { TFunction } from 'i18next';
import type { FunctionalComponent } from 'preact';
import { withTranslation } from 'react-i18next';

import { ChatContainer } from '.';
import { canRenderMessage, canRenderTriggerMessage } from '../../helpers/canRenderMessage';
import { formatAgent } from '../../helpers/formatAgent';
import { Consumer } from '../../store';

export const ChatConnector: FunctionalComponent<{ path: string; default: boolean; t: TFunction }> = ({ ref, t }) => (
	<Consumer>
		{({
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
				} = {},
				messages: { conversationFinishedMessage } = {},
				theme: { title } = {},
				departments = {},
			},
			iframe: { theme: { title: customTitle } = {}, guest } = {},
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
			incomingCallAlert,
			ongoingCall,
			messageListPosition,
		}) => (
			<ChatContainer
				ref={ref}
				title={customTitle || title || t('need_help')}
				sound={sound}
				token={token}
				user={user}
				agent={formatAgent(agent)}
				room={room}
				messages={messages?.filter(canRenderMessage).filter(canRenderTriggerMessage(user))}
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
				incomingCallAlert={incomingCallAlert}
				ongoingCall={ongoingCall}
				messageListPosition={messageListPosition}
			/>
		)}
	</Consumer>
);

export default withTranslation()(ChatConnector);
