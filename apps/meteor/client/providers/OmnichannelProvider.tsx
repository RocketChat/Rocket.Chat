import type { IOmnichannelAgent, IRoom, OmichannelRoutingConfig, OmnichannelSortingMechanismSettingType } from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useUser, useSetting, usePermission, useMethod, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { millisecondsToMinutes } from 'date-fns';
import type { FC } from 'react';
import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';

import { LivechatInquiry } from '../../app/livechat/client/collections/LivechatInquiry';
import { initializeLivechatInquiryStream } from '../../app/livechat/client/lib/stream/queueManager';
import { getOmniChatSortQuery } from '../../app/livechat/lib/inquiries';
import { Notifications } from '../../app/notifications/client';
import { useHasLicenseModule } from '../../ee/client/hooks/useHasLicenseModule';
import { ClientLogger } from '../../lib/ClientLogger';
import type { OmnichannelContextValue } from '../contexts/OmnichannelContext';
import { OmnichannelContext } from '../contexts/OmnichannelContext';
import { useReactiveValue } from '../hooks/useReactiveValue';

const emptyContextValue: OmnichannelContextValue = {
	inquiries: { enabled: false },
	enabled: false,
	agentAvailable: false,
	showOmnichannelQueueLink: false,
	livechatPriorities: {
		enabled: false,
		data: [],
		isLoading: false,
		isError: false,
	},
};

const OmnichannelProvider: FC = ({ children }) => {
	const omniChannelEnabled = useSetting('Livechat_enabled') as boolean;
	const omnichannelRouting = useSetting('Livechat_Routing_Method');
	const showOmnichannelQueueLink = useSetting('Livechat_show_queue_list_link') as boolean;
	const omnichannelPoolMaxIncoming = useSetting('Livechat_guest_pool_max_number_incoming_livechats_displayed') as number;
	const omnichannelSortingMechanism = useSetting('Omnichannel_sorting_mechanism') as OmnichannelSortingMechanismSettingType;

	const loggerRef = useRef(new ClientLogger('OmnichannelProvider'));
	const hasAccess = usePermission('view-l-room');
	const canViewOmnichannelQueue = usePermission('view-livechat-queue');
	const user = useUser() as IOmnichannelAgent;

	const agentAvailable = user?.statusLivechat === 'available';
	const voipCallAvailable = true; // TODO: use backend check;

	const getRoutingConfig = useMethod('livechat:getRoutingConfig');

	const [routeConfig, setRouteConfig] = useSafely(useState<OmichannelRoutingConfig | undefined>(undefined));

	const accessible = hasAccess && omniChannelEnabled;
	const iceServersSetting: any = useSetting('WebRTC_Servers');
	const isEnterprise = useHasLicenseModule('livechat-enterprise') === true;

	const getPriorities = useEndpoint('GET', '/v1/livechat/priorities');

	const {
		data: { priorities = [] } = {},
		isLoading: isLoadingPriorities,
		isError: isErrorPriorities,
	} = useQuery(['/v1/livechat/priorities'], () => getPriorities({ sort: JSON.stringify({ sortItem: 1 }) }), {
		staleTime: millisecondsToMinutes(10),
		enabled: isEnterprise && accessible,
	});

	useEffect(() => {
		if (!accessible) {
			return;
		}

		const update = async (): Promise<void> => {
			try {
				const routeConfig = await getRoutingConfig();
				setRouteConfig(routeConfig);
			} catch (error) {
				loggerRef.current.error(`update() error in routeConfig ${error}`);
			}
		};

		if (omnichannelRouting || !omnichannelRouting) {
			update();
		}
	}, [accessible, getRoutingConfig, iceServersSetting, omnichannelRouting, setRouteConfig, voipCallAvailable]);

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
					sort: getOmniChatSortQuery(omnichannelSortingMechanism),
					limit: omnichannelPoolMaxIncoming,
				},
			).fetch();
		}, [manuallySelected, omnichannelPoolMaxIncoming, omnichannelSortingMechanism, user?._id]),
	);

	const contextValue = useMemo<OmnichannelContextValue>(() => {
		if (!enabled) {
			return emptyContextValue;
		}

		const livechatPriorities = {
			enabled: isEnterprise && accessible,
			data: priorities,
			isLoading: isLoadingPriorities,
			isError: isErrorPriorities,
		};

		if (!manuallySelected) {
			return {
				...emptyContextValue,
				enabled: true,
				agentAvailable,
				voipCallAvailable,
				routeConfig,
				livechatPriorities,
			};
		}

		return {
			...emptyContextValue,
			enabled: true,
			agentAvailable,
			voipCallAvailable,
			routeConfig,
			inquiries: queue
				? {
						enabled: true,
						queue,
				  }
				: { enabled: false },
			showOmnichannelQueueLink: showOmnichannelQueueLink && !!agentAvailable,
			livechatPriorities,
		};
	}, [
		enabled,
		isEnterprise,
		accessible,
		priorities,
		isLoadingPriorities,
		isErrorPriorities,
		manuallySelected,
		agentAvailable,
		voipCallAvailable,
		routeConfig,
		queue,
		showOmnichannelQueueLink,
	]);

	return <OmnichannelContext.Provider children={children} value={contextValue} />;
};

export default memo<typeof OmnichannelProvider>(OmnichannelProvider);
