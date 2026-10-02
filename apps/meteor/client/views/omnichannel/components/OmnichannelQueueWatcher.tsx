import { useCustomSound, useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useOmnichannelContinuousSoundNotification } from '../../../hooks/useOmnichannelContinuousSoundNotification';
import { initializeLivechatInquiryStream } from '../../../lib/omnichannel/queueManager';
import { useOmnichannel } from '../hooks/useOmnichannel';

/**
 * Keeps the agent's omnichannel queue live — inquiry and priority streams, new-chat sounds — for as long as it is
 * mounted. Renders nothing.
 */
const OmnichannelQueueWatcher = () => {
	const { inquiries, livechatPriorities } = useOmnichannel();
	const userId = useUserId();
	const queryClient = useQueryClient();
	const { notificationSounds } = useCustomSound();

	const isPrioritiesEnabled = livechatPriorities.enabled;
	const isQueueEnabled = inquiries.enabled;
	const queue = inquiries.enabled ? inquiries.queue : undefined;

	const subscribeToNotifyLogged = useStream('notify-logged');
	useEffect(() => {
		if (!isPrioritiesEnabled) {
			return;
		}

		return subscribeToNotifyLogged('omnichannel.priority-changed', () => {
			queryClient.invalidateQueries({
				queryKey: ['/v1/livechat/priorities'],
			});
		});
	}, [isPrioritiesEnabled, queryClient, subscribeToNotifyLogged]);

	const subscribeToNotifyUser = useStream('notify-user');
	useEffect(() => {
		if (!isQueueEnabled || !userId) {
			return;
		}

		initializeLivechatInquiryStream(userId);
		return subscribeToNotifyUser(`${userId}/departmentAgentData`, () => {
			initializeLivechatInquiryStream(userId);
		});
	}, [isQueueEnabled, subscribeToNotifyUser, userId]);

	const lastQueueSize = useRef(0);
	useEffect(() => {
		if (lastQueueSize.current < (queue?.length ?? 0)) {
			notificationSounds.playNewRoom();
		}
		lastQueueSize.current = queue?.length ?? 0;

		return () => {
			notificationSounds.stopNewRoom();
		};
	}, [notificationSounds, queue?.length]);

	useOmnichannelContinuousSoundNotification(queue ?? []);

	return null;
};

export default OmnichannelQueueWatcher;
