import i18next from 'i18next';

import { Livechat } from '../api';
import { canRenderMessage } from '../components/helpers';
import store from '../store';
import constants from './constants';

export const updateBusinessUnit = async (newBusinessUnit) => {
	const {
		token,
		config: existingConfig,
	} = store.state;
	if (!token) {
		throw new Error('Error! no livechat token found. please make sure you initialize widget first before setting business unit');
	}

	const { departments } = await Livechat.config({
		token,
		...newBusinessUnit && { businessUnit: newBusinessUnit },
	});

	if (newBusinessUnit) {
		return store.setState({
			config: {
				...existingConfig,
				departments,
			},
			businessUnit: newBusinessUnit,
		});
	}

	await store.setState({
		config: {
			...existingConfig,
			departments,
		},
	});
	await store.unsetSinglePropInStateByName('businessUnit');
};

export const loadConfig = async () => {
	const {
		token,
		businessUnit = null,
		iframe: { guest: { department } = {} } = {},
	} = store.state;

	Livechat.credentials.token = token;

	const {
		agent,
		room,
		guest: user,
		resources: { sound: src = null } = {},
		queueInfo,
		...config
	} = await Livechat.config({
		token,
		...businessUnit && { businessUnit },
		...department && { department },
	});

	await store.setState({
		config,
		agent: agent && agent.hiddenInfo ? { hiddenInfo: true } : agent, // TODO: revert it when the API is updated
		room,
		user,
		queueInfo,
		sound: { src, enabled: true, play: false },
		messages: [],
		typing: [],
		noMoreMessages: false,
		visible: true,
		unread: null,
	});
};

export const processUnread = async () => {
	const { minimized, visible, messages } = store.state;

	if (minimized || !visible) {
		const { alerts, lastReadMessageId } = store.state;
		const renderedMessages = messages.filter((message) => canRenderMessage(message));
		const lastReadMessageIndex = renderedMessages.findIndex((item) => item._id === lastReadMessageId);
		const unreadMessages = renderedMessages.slice(lastReadMessageIndex + 1);

		if (lastReadMessageIndex !== -1) {
			const lastReadMessage = renderedMessages[lastReadMessageIndex];
			const alertMessage = i18next.t('count_new_messages_since_since', {
				count: unreadMessages.length,
				val: new Date(lastReadMessage.ts),
				formatParams: {
					val: { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' },
				},
			});
			const alert = { id: constants.unreadMessagesAlertId, children: alertMessage, success: true, timeout: 0 };
			const newAlerts = alerts.filter((item) => item.id !== constants.unreadMessagesAlertId);
			await store.setState({ alerts: (newAlerts.push(alert), newAlerts) });
		}

		await store.setState({ unread: unreadMessages.length });
	}
};
