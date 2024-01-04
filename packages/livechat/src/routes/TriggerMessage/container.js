import { Component } from 'preact';
import { route } from 'preact-router';

import { getAvatarUrl } from '../../helpers/baseUrl';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import { parentCall } from '../../lib/parentCall';
import { Consumer } from '../../store';
import TriggerMessage from './component';

export class TriggerMessageContainer extends Component {
	handleStart(props) {
		parentCall('setFullScreenDocumentMobile');
		parentCall('openWidget');
		props.onRestore();
		route('/');
	}

	render = (props) => {
		parentCall('resetDocumentStyle');
		return <TriggerMessage onStartChat={() => this.handleStart(props)} {...props} />;
	};
}

/** @type {function({ ref?: any; path?: string }): any} */
export const TriggerMessageConnector = ({ ref, ...props }) => (
	<Consumer>
		{({
			config: { theme: { color } = {} } = {},
			iframe: { theme: { color: customColor, fontColor: customFontColor, iconColor: customIconColor } = {} } = {},
			messages,
			agent,
			unread,
		}) => (
			<TriggerMessageContainer
				ref={ref}
				{...props}
				theme={{
					color: customColor || color,
					fontColor: customFontColor,
					iconColor: customIconColor,
				}}
				unread={unread}
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
				messages={messages && messages.filter(canRenderMessage)}
			/>
		)}
	</Consumer>
);

export default TriggerMessageConnector;
