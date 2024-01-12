import { route } from 'preact-router';

import store from '../store';
import { createToken } from './random';
import { getAgent, removeMessage, requestTriggerMessages, upsertMessage } from './triggerUtils';
import Triggers from './triggers';

export const sendMessageAction = async (action, condition) => {
	const { token, minimized } = store.state;

	const agent = getAgent(action);

	const message = {
		msg: action.params.msg,
		token,
		u: agent,
		ts: new Date().toISOString(),
		_id: createToken(),
	};

	await upsertMessage(message);

	if (minimized) {
		route('/trigger-messages');
		store.setState({ minimized: false });
	}

	if (condition.name !== 'after-registration') {
		const onVisitorRegistered = async () => {
			await removeMessage(message._id);
			Triggers.callbacks.off('chat-visitor-registered', onVisitorRegistered);
		};

		Triggers.callbacks.on('chat-visitor-registered', onVisitorRegistered);
	}
};

export const sendMessageExternalServiceAction = async (triggerId, action, condition) => {
	const { token, minimized, typing, iframe } = store.state;
	const { metadata = {} } = iframe.guest || {};
	const { serviceUrl, serviceFallbackMessage, serviceTimeout } = action.params;
	console.log(serviceUrl, serviceFallbackMessage, serviceTimeout);
	const agent = await getAgent(action);

	store.setState({ typing: [...typing, agent.username] });

	try {
		const triggerMessages = await requestTriggerMessages({
			token,
			triggerId,
			metadata,
		});

		const messages = triggerMessages
			.sort((a, b) => a.order - b.order)
			.map((item) => item.msg)
			.map((msg) => ({
				msg,
				token,
				u: agent,
				ts: new Date().toISOString(),
				_id: createToken(),
			}));

		await Promise.all(messages.map((message) => upsertMessage(message)));

		if (minimized) {
			route('/trigger-messages');
			store.setState({ minimized: false });
		}

		if (condition.name !== 'after-registration') {
			const onVisitorRegistered = async () => {
				await Promise.all(messages.map((message) => removeMessage(message._id)));
				Triggers.callbacks.off('chat-visitor-registered', onVisitorRegistered);
			};

			Triggers.callbacks.on('chat-visitor-registered', onVisitorRegistered);
		}
	} finally {
		store.setState({
			typing: store.state.typing.filter((u) => u !== agent.username),
		});
	}
};

export const actions = {
	'send-message': sendMessageAction,
	'use-external-service': sendMessageExternalServiceAction,
};
