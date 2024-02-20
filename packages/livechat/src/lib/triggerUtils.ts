import type { ILivechatAgent, ILivechatTrigger, ILivechatTriggerAction, ILivechatTriggerType, Serialized } from '@rocket.chat/core-typings';

import { Livechat } from '../api';
import { upsert } from '../helpers/upsert';
import store from '../store';
import { processUnread } from './main';

type AgentPromise = { username: string } | Serialized<ILivechatAgent> | null;

const agentCacheExpiry = 3600000;

const isAgentWithInfo = (agent: any): agent is Serialized<ILivechatAgent> => !agent.hiddenInfo;

const getNextAgentFromQueue = async () => {
	const {
		defaultAgent,
		iframe: {
			guest: { department },
		},
	} = store.state;

	if (defaultAgent?.ts && Date.now() - defaultAgent.ts < agentCacheExpiry) {
		return defaultAgent; // cache valid for 1 hour
	}

	let agent = null;
	try {
		const tempAgent = await Livechat.nextAgent({ department });

		if (isAgentWithInfo(tempAgent?.agent)) {
			agent = tempAgent.agent;
		}
	} catch (error) {
		return Promise.reject(error);
	}

	store.setState({ defaultAgent: { ...agent, department, ts: Date.now() } });

	return agent;
};

export const getAgent = async (triggerAction: ILivechatTriggerAction): Promise<AgentPromise> => {
	const { sender, name = '' } = triggerAction.params || {};

	if (sender === 'custom') {
		return { username: name };
	}

	if (sender === 'queue') {
		return getNextAgentFromQueue();
	}

	return Promise.reject('Unknown sender');
};

export const upsertMessage = async (message: Record<string, unknown>) => {
	await store.setState({
		messages: upsert(
			store.state.messages,
			message,
			({ _id }) => _id === message._id,
			({ ts }) => new Date(ts).getTime(),
		),
	});

	await processUnread();
};

export const removeMessage = async (messageId: string) => {
	const { messages } = store.state;
	await store.setState({ messages: messages.filter(({ _id }) => _id !== messageId) });
};

export const hasTriggerCondition = (conditionName: ILivechatTriggerType) => (trigger: ILivechatTrigger) => {
	return trigger.conditions.some((condition) => condition.name === conditionName);
};

export const isInIframe = () => window.self !== window.top;

export const requestTriggerMessages = async ({
	triggerId,
	token,
	metadata = {},
}: {
	triggerId: string;
	token: string;
	metadata: Record<string, string>;
}) => {
	try {
		const extraData = Object.entries(metadata).reduce<{ key: string; value: string }[]>(
			(acc, [key, value]) => [...acc, { key, value }],
			[],
		);

		const { response } = await Livechat.rest.post(`/v1/livechat/triggers/${triggerId}/external-service/call`, { extraData, token });
		return response.contents;
	} catch (e) {
		const error = e as { fallbackMessage?: string };
		if (!error.fallbackMessage) {
			throw Error('Unable to fetch message from external service.');
		}

		return [{ msg: error.fallbackMessage, order: 0 }];
	}
};
