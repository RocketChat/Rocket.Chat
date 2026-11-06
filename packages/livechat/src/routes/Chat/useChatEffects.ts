import { useRef, useCallback, useLayoutEffect } from 'preact/hooks';
import { useTranslation } from 'react-i18next';

import { useStableCallback } from './useStableCallback';
import { canRenderMessage } from '../../helpers/canRenderMessage';
import { upsert } from '../../helpers/upsert';
import { normalizeQueueAlert } from '../../lib/api';
import constants from '../../lib/constants';
import { processUnread, shouldMarkAsUnread, getLastReadMessage } from '../../lib/main';
import { loadMessages } from '../../lib/room';
import { useStore, type StoreState } from '../../store';

export const useChatEffects = () => {
	const {
		config: {
			settings: { showConnecting },
		},
		agent,
		user,
		room,
		dispatch,
		alerts,
		queueInfo,
	} = useStore();

	const { t } = useTranslation();

	const innerStateRef = useRef<{
		connectingAgent: boolean;
		queueSpot: number;
		triggerQueueMessage: boolean;
		estimatedWaitTime: number | null | undefined;
	}>({
		connectingAgent: false,
		queueSpot: 0,
		triggerQueueMessage: true,
		estimatedWaitTime: null,
	});

	const roomRef = useRef<StoreState['room']>();

	const checkRoom = useCallback(() => {
		if (!room || room._id === roomRef.current?._id) return;

		roomRef.current = room;
		setTimeout(loadMessages, 500);
	}, [room]);

	const handleConnectingAgentAlert = useStableCallback(async (connecting: boolean, message?: string | false) => {
		const { connectingAgentAlertId } = constants;
		const newAlerts = alerts.filter((item) => item.id !== connectingAgentAlertId);
		if (connecting) {
			newAlerts.push({
				id: connectingAgentAlertId,
				children: message || t('please_wait_for_the_next_available_agent'),
				warning: true,
				hideCloseButton: true,
				timeout: 0,
			});
		}

		dispatch({ alerts: newAlerts });
	});

	const messages = useStore().messages?.filter(canRenderMessage) ?? [];

	const handleQueueMessage = useStableCallback(async (connecting: boolean, queueInfo?: StoreState['queueInfo']) => {
		if (!queueInfo) return;

		const { livechatQueueMessageId } = constants;
		const { message: { text: msg, user: u } = {} } = queueInfo;
		const { triggerQueueMessage } = innerStateRef.current;

		if (!room || !connecting || !msg || !triggerQueueMessage) {
			return;
		}

		innerStateRef.current.triggerQueueMessage = false;

		const ts = new Date();
		const message = { _id: livechatQueueMessageId, msg, u, ts: ts.toISOString() };
		dispatch({
			messages: upsert(
				messages,
				message,
				({ _id }) => _id === message._id,
				({ ts }) => ts,
			),
		});
	});

	const checkConnectingAgent = useStableCallback(async () => {
		const { connectingAgent, queueSpot, estimatedWaitTime } = innerStateRef.current;

		const newConnecting = !!(room && !agent && (showConnecting || queueInfo));
		const newQueueSpot = queueInfo?.spot || 0;
		const newEstimatedWaitTime = queueInfo?.estimatedWaitTimeSeconds;

		if (newConnecting !== connectingAgent || newQueueSpot !== queueSpot || newEstimatedWaitTime !== estimatedWaitTime) {
			innerStateRef.current.connectingAgent = newConnecting;
			innerStateRef.current.queueSpot = newQueueSpot;
			innerStateRef.current.estimatedWaitTime = newEstimatedWaitTime;
			await handleQueueMessage(newConnecting, queueInfo);
			await handleConnectingAgentAlert(newConnecting, await normalizeQueueAlert(queueInfo));
		}
	});

	useLayoutEffect(() => {
		void (async () => {
			await checkConnectingAgent();
			await loadMessages();
			void processUnread();
		})();

		return () => {
			void handleConnectingAgentAlert(false);
		};
	}, [checkConnectingAgent, handleConnectingAgentAlert]);

	const firstRenderRef = useRef(true);
	const messagesRef = useRef(messages);
	const alertsRef = useRef(alerts);

	useLayoutEffect(() => {
		if (firstRenderRef.current) {
			firstRenderRef.current = false;
			return;
		}

		const prevRenderedMessages = messagesRef.current.filter(canRenderMessage);
		messagesRef.current = messages;
		const renderedMessages = messages.filter(canRenderMessage);
		const lastRenderedMessage = renderedMessages.at(-1);

		const prevAlerts = alertsRef.current;
		alertsRef.current = alerts;

		const shouldMarkUnread = shouldMarkAsUnread();

		if (
			(lastRenderedMessage && lastRenderedMessage.u?._id === user?._id) ||
			(!shouldMarkUnread && renderedMessages?.length !== prevRenderedMessages?.length)
		) {
			const nextLastMessage = lastRenderedMessage;
			const lastReadMessage = getLastReadMessage();

			if (nextLastMessage && nextLastMessage._id !== lastReadMessage?._id) {
				const newAlerts = prevAlerts.filter((item) => item.id !== constants.unreadMessagesAlertId);
				dispatch({ alerts: newAlerts, unread: null, lastReadMessageId: nextLastMessage._id });
			}
		}

		void (async () => {
			await checkConnectingAgent();
			checkRoom();
		})();
	});
};
