import { route } from 'preact-router';

import store from '../store';
import { createToken } from './random';
import { getAgent, upsertMessage } from './triggerUtils';

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
		context: params.context,
	};

	await upsertMessage(message);

	if (minimized) {
		route('/trigger-messages');
		store.setState({ minimized: false });
	}
};

export const actions = {
	'send-message': sendMessageAction,
};
