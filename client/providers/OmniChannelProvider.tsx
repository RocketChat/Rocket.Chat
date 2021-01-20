import React, { useState, useEffect, FC, useCallback, useMemo } from 'react';


import { OmichannelRoutingConfig } from '../../definition/OmichannelRoutingConfig';
import { IOmnichannelAgent } from '../../definition/IOmnichannelAgent';
import { Notifications } from '../../app/notifications/client';
import { OmnichannelContext, OmnichannelContextValue } from '../contexts/OmnichannelContext';
import { useReactiveValue } from '../hooks/useReactiveValue';
import { useUser, useUserId } from '../contexts/UserContext';
import { usePermission } from '../contexts/AuthorizationContext';
import { useSetting } from '../contexts/SettingsContext';
import { LivechatInquiry } from '../../app/livechat/client/collections/LivechatInquiry';
import { initializeLivechatInquiryStream } from '../../app/livechat/client/lib/stream/queueManager';
import { useMethodData } from '../hooks/useMethodData';
import { AsyncStatePhase } from '../hooks/useAsyncState';

const args = [] as any;

const emptyContext = {
	inquiries: { enabled: false },
	enabled: false,
	agentAvailable: false,
	showOmnichannelQueueLink: false,
} as OmnichannelContextValue;


const useOmnichannelInquiries = (): Array<any> => {
	const uid = useUserId();
	const omnichannelPoolMaxIncoming = useSetting('Livechat_guest_pool_max_number_incoming_livechats_displayed') as number;
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

	return useReactiveValue(useCallback(() => LivechatInquiry.find({
		status: 'queued',
	}, {
		sort: {
			queueOrder: 1,
			estimatedWaitingTimeQueue: 1,
			estimatedServiceTimeAt: 1,
		},
		limit: omnichannelPoolMaxIncoming,
	}).fetch(), [omnichannelPoolMaxIncoming]));
};

const OmnichannelDisabledProvider: FC = ({ children }) => <OmnichannelContext.Provider value={emptyContext} children={children}/>;

const OmnichannelManualSelectionProvider: FC<{ value: OmnichannelContextValue }> = ({ value, children }) => {
	const queue = useOmnichannelInquiries();
	const showOmnichannelQueueLink = useSetting('Livechat_show_queue_list_link') as boolean && value.agentAvailable;

	const contextValue = useMemo(() => ({
		...value,
		inquiries: {
			enabled: true,
			queue,
		},
		showOmnichannelQueueLink,
	}), [value, queue, showOmnichannelQueueLink]);

	return <OmnichannelContext.Provider value={contextValue} children={children}/>;
};

const OmnichannelEnabledProvider: FC = ({ children }) => {
	const omnichannelRouting = useSetting('Livechat_Routing_Method');
	const [contextValue, setContextValue] = useState<OmnichannelContextValue>({
		...emptyContext,
		enabled: true,
	});

	const user = useUser() as IOmnichannelAgent;
	const { value: routeConfig, phase: status, reload } = useMethodData<OmichannelRoutingConfig>('livechat:getRoutingConfig', args);

	const canViewOmnichannelQueue = usePermission('view-livechat-queue');

	useEffect(() => {
		status !== AsyncStatePhase.LOADING && reload();
	}, [omnichannelRouting, reload]); // eslint-disable-line

	useEffect(() => {
		setContextValue((context) => ({
			...context,
			agentAvailable: user?.statusLivechat === 'available',
		}));
	}, [user?.statusLivechat]);

	if (!routeConfig || !user) {
		return <OmnichannelDisabledProvider children={children}/>;
	}

	if (canViewOmnichannelQueue && routeConfig.showQueue && !routeConfig.autoAssignAgent && contextValue.agentAvailable) {
		return <OmnichannelManualSelectionProvider value={contextValue} children={children} />;
	}


	return <OmnichannelContext.Provider value={contextValue} children={children}/>;
};

const OmniChannelProvider: FC = React.memo(({ children }) => {
	const omniChannelEnabled = useSetting('Livechat_enabled') as boolean;
	const hasAccess = usePermission('view-l-room') as boolean;

	if (!omniChannelEnabled || !hasAccess) {
		return <OmnichannelDisabledProvider children={children}/>;
	}
	return <OmnichannelEnabledProvider children={children}/>;
});

export default OmniChannelProvider;
