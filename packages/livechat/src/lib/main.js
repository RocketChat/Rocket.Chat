import i18next from 'i18next';

import { Livechat } from '../api';
import { canRenderMessage } from '../helpers/canRenderMessage';
import store from '../store';
import constants from './constants';

export const updateBusinessUnit = async (newBusinessUnit) => {
	const { token, config: existingConfig } = store.state;
	if (!token) {
		throw new Error('Error! no livechat token found. please make sure you initialize widget first before setting business unit');
	}

	const { departments } = await Livechat.config({
		token,
		...(newBusinessUnit && { businessUnit: newBusinessUnit }),
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
	const { token, businessUnit = null, iframe: { guest: { department } = {} } = {} } = store.state;

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
		...(businessUnit && { businessUnit }),
		...(department && { department }),
	});

	await store.setState({
		config: { ...config, loading: false },
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

	return store.state;
};

export const shouldMarkAsUnread = () => {
	const { minimized, visible, messageListPosition } = store.state;
	return minimized || !visible || (messageListPosition !== undefined && messageListPosition !== 'bottom');
};

export const getLastReadMessage = () => {
	const { messages, lastReadMessageId, user } = store.state;

	const renderedMessages = messages.filter((message) => canRenderMessage(message));

	return lastReadMessageId
		? renderedMessages.find((item) => item._id === lastReadMessageId)
		: renderedMessages
				.slice()
				.reverse()
				.find((item) => item.u._id === user?._id);
};

export const getUnreadMessages = () => {
	const { messages, user, lastReadMessageId } = store.state;

	const renderedMessages = messages.filter((message) => canRenderMessage(message));
	const lastReadMessageIndex = lastReadMessageId
		? renderedMessages.findIndex((item) => item._id === lastReadMessageId)
		: renderedMessages
				.slice()
				.reverse()
				.findIndex((item) => item.u._id === user?._id);

	if (lastReadMessageIndex !== -1) {
		const unreadMessages = renderedMessages.slice(lastReadMessageIndex + 1).filter((message) => message.u._id !== user?._id);

		return unreadMessages;
	}

	return [];
};

export const processUnread = async () => {
	const shouldMarkUnread = shouldMarkAsUnread();
	if (shouldMarkUnread) {
		const unreadMessages = getUnreadMessages();

		if (unreadMessages.length > 0) {
			const { alerts } = store.state;
			const lastReadMessage = getLastReadMessage();
			const alertMessage = i18next.t('count_new_messages_since_since', {
				count: unreadMessages.length,
				val: new Date(lastReadMessage.ts),
				formatParams: {
					val: { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' },
				},
			});

			const alert = { id: constants.unreadMessagesAlertId, children: alertMessage, success: true, timeout: 0 };
			const newAlerts = alerts.filter((item) => item.id !== constants.unreadMessagesAlertId);
			await store.setState({ alerts: (newAlerts.push(alert), newAlerts), unread: unreadMessages.length });
		}
	}
};
