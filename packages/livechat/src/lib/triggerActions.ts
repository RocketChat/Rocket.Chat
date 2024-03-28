import type { ILivechatSendMessageAction, ILivechatTriggerCondition, ILivechatUseExternalServiceAction } from '@rocket.chat/core-typings';
import { route } from 'preact-router';

import store from '../store';
import { normalizeAgent } from './api';
import { parentCall } from './parentCall';
import { createToken } from './random';
import { getAgent, removeMessage, requestTriggerMessages, upsertMessage } from './triggerUtils';
import Triggers from './triggers';

export const sendMessageAction = async (_: string, action: ILivechatSendMessageAction, condition: ILivechatTriggerCondition) => {
	const { token, minimized } = store.state;

	const agent = await getAgent(action);

	const message = {
		msg: action.params?.msg,
		token,
		u: agent,
		ts: new Date().toISOString(),
		_id: createToken(),
		trigger: true,
	};

	await upsertMessage(message);

	if (agent && '_id' in agent) {
		await store.setState({ agent });
		parentCall('callback', 'assign-agent', normalizeAgent(agent));
	}

	if (minimized) {
		route('/trigger-messages');
		store.setState({ minimized: false });
	}

	if (condition.name !== 'after-guest-registration') {
		const onVisitorRegistered = async () => {
			await removeMessage(message._id);
			Triggers.callbacks?.off('chat-visitor-registered', onVisitorRegistered);
		};

		Triggers.callbacks?.on('chat-visitor-registered', onVisitorRegistered);
	}
};

export const sendMessageExternalServiceAction = async (
	triggerId: string,
	action: ILivechatUseExternalServiceAction,
	condition: ILivechatTriggerCondition,
) => {
	const { token, minimized, typing, iframe } = store.state;
	const metadata = iframe.guestMetadata || {};
	const agent = await getAgent(action);

	if (agent?.username) {
		store.setState({ typing: [...typing, agent.username] });
	}

	try {
		const { serviceFallbackMessage: fallbackMessage } = action.params || {};
		const triggerMessages = await requestTriggerMessages({
			token,
			triggerId,
			metadata,
			fallbackMessage,
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
				trigger: true,
			}));

		await Promise.all(messages.map((message) => upsertMessage(message)));

		if (agent && '_id' in agent) {
			await store.setState({ agent });
			parentCall('callback', 'assign-agent', normalizeAgent(agent));
		}

		if (minimized) {
			route('/trigger-messages');
			store.setState({ minimized: false });
		}

		if (condition.name !== 'after-guest-registration') {
			const onVisitorRegistered = async () => {
				await Promise.all(messages.map((message) => removeMessage(message._id)));
				Triggers.callbacks?.off('chat-visitor-registered', onVisitorRegistered);
			};

			Triggers.callbacks?.on('chat-visitor-registered', onVisitorRegistered);
		}
	} finally {
		store.setState({
			typing: store.state.typing.filter((u) => u !== agent?.username),
		});
	}
};

export const actions = {
	'send-message': sendMessageAction,
	'use-external-service': sendMessageExternalServiceAction,
};
