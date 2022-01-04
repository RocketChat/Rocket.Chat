import React, { useState, useEffect, FC, useMemo, useCallback, memo } from 'react';

import { LivechatInquiry } from '../../app/livechat/client/collections/LivechatInquiry';
import { initializeLivechatInquiryStream } from '../../app/livechat/client/lib/stream/queueManager';
import { Notifications } from '../../app/notifications/client';
import { IOmnichannelAgent } from '../../definition/IOmnichannelAgent';
import { IRoom } from '../../definition/IRoom';
import { OmichannelRoutingConfig } from '../../definition/OmichannelRoutingConfig';
import { usePermission } from '../contexts/AuthorizationContext';
import { OmnichannelContext, OmnichannelContextValue } from '../contexts/OmnichannelContext';
import { useMethod } from '../contexts/ServerContext';
import { useSetting } from '../contexts/SettingsContext';
import { useUser } from '../contexts/UserContext';
import { useReactiveValue } from '../hooks/useReactiveValue';

const emptyContextValue: OmnichannelContextValue = {
	inquiries: { enabled: false },
	enabled: false,
	agentAvailable: false,
	showOmnichannelQueueLink: false,
};

const OmnichannelProvider: FC = ({ children }) => {
	const omniChannelEnabled = useSetting('Livechat_enabled') as boolean;
	const omnichannelRouting = useSetting('Livechat_Routing_Method');
	const showOmnichannelQueueLink = useSetting('Livechat_show_queue_list_link') as boolean;
	const omnichannelPoolMaxIncoming = useSetting('Livechat_guest_pool_max_number_incoming_livechats_displayed') as number;

	const hasAccess = usePermission('view-l-room');
	const canViewOmnichannelQueue = usePermission('view-livechat-queue');

	const user = useUser() as IOmnichannelAgent;

	const agentAvailable = user?.statusLivechat === 'available';

	const getRoutingConfig = useMethod('livechat:getRoutingConfig');

	const [routeConfig, setRouteConfig] = useState<OmichannelRoutingConfig | undefined>(undefined);

	const accessible = hasAccess && omniChannelEnabled;

	useEffect(() => {
		if (!accessible) {
			return;
		}

		const update = async (): Promise<void> => {
			try {
				const routeConfig = await getRoutingConfig();
				setRouteConfig(routeConfig);
			} catch (error) {
				console.error(error);
			}
		};

		if (omnichannelRouting || !omnichannelRouting) {
			update();
		}
	}, [accessible, getRoutingConfig, omnichannelRouting]);

	const enabled = accessible && !!user && !!routeConfig;
	const manuallySelected =
		enabled && canViewOmnichannelQueue && !!routeConfig && routeConfig.showQueue && !routeConfig.autoAssignAgent && agentAvailable;

	useEffect(() => {
		if (!manuallySelected) {
			return;
		}

		const handleDepartmentAgentData = (): void => {
			initializeLivechatInquiryStream(user?._id);
		};

		initializeLivechatInquiryStream(user?._id);
		Notifications.onUser('departmentAgentData', handleDepartmentAgentData);

		return (): void => {
			Notifications.unUser('departmentAgentData', handleDepartmentAgentData);
		};
	}, [manuallySelected, user?._id]);

	const queue = useReactiveValue<IRoom[] | undefined>(
		useCallback(() => {
			if (!manuallySelected) {
				return undefined;
			}

			return LivechatInquiry.find(
				{
					status: 'queued',
					$or: [{ defaultAgent: { $exists: false } }, { 'defaultAgent.agentId': user?._id }],
				},
				{
					sort: {
						queueOrder: 1,
						estimatedWaitingTimeQueue: 1,
						estimatedServiceTimeAt: 1,
					},
					limit: omnichannelPoolMaxIncoming,
				},
			).fetch();
		}, [manuallySelected, omnichannelPoolMaxIncoming, user?._id]),
	);

	const contextValue = useMemo<OmnichannelContextValue>(() => {
		if (!enabled) {
			return emptyContextValue;
		}

		if (!manuallySelected) {
			return {
				...emptyContextValue,
				enabled: true,
				agentAvailable,
				routeConfig,
			};
		}

		return {
			...emptyContextValue,
			enabled: true,
			agentAvailable,
			routeConfig,
			inquiries: queue
				? {
						enabled: true,
						queue,
				  }
				: { enabled: false },
			showOmnichannelQueueLink: showOmnichannelQueueLink && !!agentAvailable,
		};
	}, [agentAvailable, enabled, manuallySelected, queue, routeConfig, showOmnichannelQueueLink]);

	return <OmnichannelContext.Provider children={children} value={contextValue} />;
};

export default memo<typeof OmnichannelProvider>(OmnichannelProvider);
