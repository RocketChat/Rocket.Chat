import { Component } from 'preact';
import { route } from 'preact-router';
import { withTranslation } from 'react-i18next';

import { Consumer } from '../../store';
import ChatFinished from './component';

class ChatFinishedContainer extends Component {
	handleRedirect = () => {
		route('/');
	};

	render = (props) => <ChatFinished {...props} onRedirectChat={this.handleRedirect} />;
}

const ChatFinishedConnector = ({ ref, t, ...props }) => (
	<Consumer>
		{({
			config: { messages: { conversationFinishedMessage: greeting, conversationFinishedText: message } = {}, theme: { color } = {} } = {},
			iframe: { theme: { color: customColor, fontColor: customFontColor, iconColor: customIconColor } = {} } = {},
		}) => (
			<ChatFinishedContainer
				ref={ref}
				{...props}
				theme={{
					color: customColor || color,
					fontColor: customFontColor,
					iconColor: customIconColor,
				}}
				title={t('chat_finished')}
				greeting={greeting}
				message={message}
			/>
		)}
	</Consumer>
);

export default withTranslation()(ChatFinishedConnector);
