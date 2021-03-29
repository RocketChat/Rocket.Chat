import React, { useEffect, FC, useCallback, useMemo } from 'react';

import { LivechatInquiry } from '../../app/livechat/client/collections/LivechatInquiry';
import { initializeLivechatInquiryStream } from '../../app/livechat/client/lib/stream/queueManager';
import { Notifications } from '../../app/notifications/client';
import { OmnichannelContext, OmnichannelContextValue } from '../contexts/OmnichannelContext';
import { useSetting } from '../contexts/SettingsContext';
import { useUserId } from '../contexts/UserContext';
import { useReactiveValue } from '../hooks/useReactiveValue';

const useOmnichannelInquiries = (): Array<any> => {
	const uid = useUserId();
	const omnichannelPoolMaxIncoming = useSetting(
		'Livechat_guest_pool_max_number_incoming_livechats_displayed',
	) as number;
	useEffect(() => {
		const handler = async (): Promise<void> => {
			initializeLivechatInquiryStream(uid);
		};

		(async (): Promise<void> => {
			initializeLivechatInquiryStream(uid);
			Notifications.onUser('departmentAgentData', handler);
		})();

		return (): void => {
			Notifications.unUser('departmentAgentData', handler);
		};
	}, [uid]);

	return useReactiveValue(
		useCallback(
			() =>
				LivechatInquiry.find(
					{
						status: 'queued',
						$or: [{ defaultAgent: { $exists: false } }, { 'defaultAgent.agentId': uid }],
					},
					{
						sort: {
							queueOrder: 1,
							estimatedWaitingTimeQueue: 1,
							estimatedServiceTimeAt: 1,
						},
						limit: omnichannelPoolMaxIncoming,
					},
				).fetch(),
			[omnichannelPoolMaxIncoming, uid],
		),
	);
};

const OmnichannelManualSelectionProvider: FC<{ value: OmnichannelContextValue }> = ({
	value,
	children,
}) => {
	const queue = useOmnichannelInquiries();
	const showOmnichannelQueueLink =
		(useSetting('Livechat_show_queue_list_link') as boolean) && value.agentAvailable;

	const contextValue = useMemo(
		() => ({
			...value,
			inquiries: {
				enabled: true,
				queue,
			},
			showOmnichannelQueueLink,
		}),
		[value, queue, showOmnichannelQueueLink],
	);

	return <OmnichannelContext.Provider value={contextValue} children={children} />;
};

export default OmnichannelManualSelectionProvider;
