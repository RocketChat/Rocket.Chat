import { Livechat } from '../api';
import { upsert } from '../helpers/upsert';
import store from '../store';
import { processUnread } from './main';

let agentPromise;
const agentCacheExpiry = 3600000;

export const getAgent = (triggerAction) => {
	if (agentPromise) {
		return agentPromise;
	}

	agentPromise = new Promise(async (resolve, reject) => {
		const { params } = triggerAction;

		if (params.sender === 'queue') {
			const { state } = store;
			const {
				defaultAgent,
				iframe: {
					guest: { department },
				},
			} = state;
			if (defaultAgent && defaultAgent.ts && Date.now() - defaultAgent.ts < agentCacheExpiry) {
				return resolve(defaultAgent); // cache valid for 1
			}

			let agent;
			try {
				agent = await Livechat.nextAgent({ department });
			} catch (error) {
				return reject(error);
			}

			store.setState({ defaultAgent: { ...agent, department, ts: Date.now() } });
			resolve(agent);
		} else if (params.sender === 'custom') {
			resolve({
				username: params.name,
			});
		} else {
			reject('Unknown sender');
		}
	});

	// expire the promise cache as well
	setTimeout(() => {
		agentPromise = null;
	}, agentCacheExpiry);

	return agentPromise;
};

export const upsertMessage = async (message) => {
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

export const hasTriggerCondition = (conditionName) => (trigger) => {
	return trigger.conditions.some((condition) => condition.name === conditionName);
};

export const isInIframe = () => window.self !== window.top;

export const requestMessage = async (url, fallbackMessage) => {
	try {
		const response = await new Promise((resolve) => {
			setTimeout(() => resolve('message here'), 5000);
		});

		return response;
	} catch (error) {
		if (!fallbackMessage) {
			throw Error('Unable to fetch message from external service.');
		}

		return fallbackMessage;
	}
};
