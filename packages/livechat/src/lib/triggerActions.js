import { route } from 'preact-router';

import store from '../store';
import { createToken } from './random';
import { getAgent, requestMessage, upsertMessage } from './triggerUtils';

export const sendMessageAction = async (action, params = {}) => {
	const { token, minimized } = store.state;
	const agent = getAgent(action);

	const message = {
		msg: action.params.msg,
		token,
		u: agent,
		ts: new Date().toISOString(),
		_id: createToken(),
		origin: 'trigger',
		scope: params.scope || 'before-registration',
	};

	await upsertMessage(message);

	if (minimized) {
		route('/trigger-messages');
		store.setState({ minimized: false });
	}
};

export const sendMessageExternalServiceAction = async (action, params = {}) => {
	const { token, minimized, typing } = store.state;
	const { value: url, fallbackMessage } = action.params;

	const agent = await getAgent(action);

	store.setState({ typing: [...typing, agent.username] });

	try {
		const msg = await requestMessage(url, fallbackMessage);

		await upsertMessage({
			msg,
			token,
			u: agent,
			ts: new Date().toISOString(),
			_id: createToken(),
			origin: 'trigger',
			scope: params.scope || 'before-registration',
		});

		if (minimized) {
			route('/trigger-messages');
			store.setState({ minimized: false });
		}
	} finally {
		store.setState({
			typing: store.state.typing.filter((u) => u !== agent.username),
		});
	}
};

export const actions = {
	'send-message': sendMessageAction,
	'send-message-external-service': sendMessageExternalServiceAction,
};
