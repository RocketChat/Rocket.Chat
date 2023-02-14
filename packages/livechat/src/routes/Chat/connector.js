import { withTranslation } from 'react-i18next';

import { ChatContainer } from '.';
import { canRenderMessage, getAvatarUrl } from '../../components/helpers';
import { Consumer } from '../../store';

const ChatConnector = ({ ref, ...props }) => (
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
				theme: { color, title } = {},
				departments = {},
			},
			iframe: {
				theme: { color: customColor, fontColor: customFontColor, iconColor: customIconColor, title: customTitle } = {},
				guest,
			} = {},
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
		}) => (
			<ChatContainer
				ref={ref}
				{...props}
				theme={{
					color: customColor || color,
					fontColor: customFontColor,
					iconColor: customIconColor,
					title: customTitle,
				}}
				title={customTitle || title || props.t('need_help')}
				sound={sound}
				token={token}
				user={user}
				agent={
					agent
						? {
								_id: agent._id,
								name: agent.name,
								status: agent.status,
								email: agent.emails && agent.emails[0] && agent.emails[0].address,
								username: agent.username,
								phone: (agent.phone && agent.phone[0] && agent.phone[0].phoneNumber) || (agent.customFields && agent.customFields.phone),
								avatar: agent.username
									? {
											description: agent.username,
											src: getAvatarUrl(agent.username),
									  }
									: undefined,
						  }
						: undefined
				}
				room={room}
				messages={messages && messages.filter((message) => canRenderMessage(message))}
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
				conversationFinishedMessage={conversationFinishedMessage || props.t('conversation_finished')}
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
			/>
		)}
	</Consumer>
);

export default withTranslation()(ChatConnector);
