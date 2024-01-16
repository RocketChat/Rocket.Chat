import type {
	IOmnichannelAgent,
	OmichannelRoutingConfig,
	OmnichannelSortingMechanismSettingType,
	ILivechatInquiryRecord,
} from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useUser, useSetting, usePermission, useMethod, useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { FC } from 'react';
import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';

import { LivechatInquiry } from '../../app/livechat/client/collections/LivechatInquiry';
import { initializeLivechatInquiryStream } from '../../app/livechat/client/lib/stream/queueManager';
import { getOmniChatSortQuery } from '../../app/livechat/lib/inquiries';
import { KonchatNotification } from '../../app/ui/client/lib/KonchatNotification';
import { useHasLicenseModule } from '../../ee/client/hooks/useHasLicenseModule';
import { ClientLogger } from '../../lib/ClientLogger';
import type { OmnichannelContextValue } from '../contexts/OmnichannelContext';
import { OmnichannelContext } from '../contexts/OmnichannelContext';
import { useReactiveValue } from '../hooks/useReactiveValue';
import { useShouldPreventAction } from '../hooks/useShouldPreventAction';

const emptyContextValue: OmnichannelContextValue = {
	inquiries: { enabled: false },
	enabled: false,
	isEnterprise: false,
	agentAvailable: false,
	showOmnichannelQueueLink: false,
	isOverMacLimit: false,
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
	const omnichannelPoolMaxIncoming = useSetting<number>('Livechat_guest_pool_max_number_incoming_livechats_displayed') ?? 0;
	const omnichannelSortingMechanism = useSetting('Omnichannel_sorting_mechanism') as OmnichannelSortingMechanismSettingType;

	const loggerRef = useRef(new ClientLogger('OmnichannelProvider'));
	const hasAccess = usePermission('view-l-room');
	const canViewOmnichannelQueue = usePermission('view-livechat-queue');
	const user = useUser() as IOmnichannelAgent;

	const agentAvailable = user?.statusLivechat === 'available';
	const voipCallAvailable = true; // TODO: use backend check;

	const getRoutingConfig = useMethod('livechat:getRoutingConfig');

	const [routeConfig, setRouteConfig] = useSafely(useState<OmichannelRoutingConfig | undefined>(undefined));
	const [queueNotification, setQueueNotification] = useState(new Set());

	const accessible = hasAccess && omniChannelEnabled;
	const iceServersSetting: any = useSetting('WebRTC_Servers');
	const isEnterprise = useHasLicenseModule('livechat-enterprise') === true;

	const getPriorities = useEndpoint('GET', '/v1/livechat/priorities');
	const subscribe = useStream('notify-logged');
	const queryClient = useQueryClient();
	const isPrioritiesEnabled = isEnterprise && accessible;
	const enabled = accessible && !!user && !!routeConfig;

	const {
		data: { priorities = [] } = {},
		isInitialLoading: isLoadingPriorities,
		isError: isErrorPriorities,
	} = useQuery(['/v1/livechat/priorities'], () => getPriorities({ sort: JSON.stringify({ sortItem: 1 }) }), {
		staleTime: Infinity,
		enabled: isPrioritiesEnabled,
	});

	const isOverMacLimit = useShouldPreventAction('monthlyActiveContacts');

	useEffect(() => {
		if (!isPrioritiesEnabled) {
			return;
		}

		return subscribe('omnichannel.priority-changed', () => {
			queryClient.invalidateQueries(['/v1/livechat/priorities']);
		});
	}, [isPrioritiesEnabled, queryClient, subscribe]);

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

	const manuallySelected =
		enabled && canViewOmnichannelQueue && !!routeConfig && routeConfig.showQueue && !routeConfig.autoAssignAgent && agentAvailable;

	const streamNotifyUser = useStream('notify-user');
	useEffect(() => {
		if (!manuallySelected) {
			return;
		}

		const handleDepartmentAgentData = (): void => {
			initializeLivechatInquiryStream(user?._id);
		};

		initializeLivechatInquiryStream(user?._id);
		return streamNotifyUser(`${user._id}/departmentAgentData`, handleDepartmentAgentData);
	}, [manuallySelected, streamNotifyUser, user._id]);

	const queue = useReactiveValue<ILivechatInquiryRecord[] | undefined>(
		useCallback(() => {
			if (!manuallySelected) {
				return undefined;
			}

			return LivechatInquiry.find(
				{ status: 'queued' },
				{
					sort: getOmniChatSortQuery(omnichannelSortingMechanism),
					limit: omnichannelPoolMaxIncoming,
				},
			).fetch();
		}, [manuallySelected, omnichannelPoolMaxIncoming, omnichannelSortingMechanism]),
	);

	queue?.map(({ rid }) => {
		if (queueNotification.has(rid)) {
			return;
		}
		setQueueNotification((prev) => new Set([...prev, rid]));
		return KonchatNotification.newRoom(rid);
	});

	const contextValue = useMemo<OmnichannelContextValue>(() => {
		if (!enabled) {
			return emptyContextValue;
		}

		const livechatPriorities = {
			enabled: isPrioritiesEnabled,
			data: priorities,
			isLoading: isLoadingPriorities,
			isError: isErrorPriorities,
		};

		if (!manuallySelected) {
			return {
				...emptyContextValue,
				enabled: true,
				isEnterprise,
				agentAvailable,
				voipCallAvailable,
				routeConfig,
				livechatPriorities,
				isOverMacLimit,
			};
		}

		return {
			...emptyContextValue,
			enabled: true,
			isEnterprise,
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
			isOverMacLimit,
		};
	}, [
		enabled,
		isPrioritiesEnabled,
		priorities,
		isLoadingPriorities,
		isErrorPriorities,
		manuallySelected,
		isEnterprise,
		agentAvailable,
		voipCallAvailable,
		routeConfig,
		queue,
		showOmnichannelQueueLink,
		isOverMacLimit,
	]);

	return <OmnichannelContext.Provider children={children} value={contextValue} />;
};

export default memo<typeof OmnichannelProvider>(OmnichannelProvider);
