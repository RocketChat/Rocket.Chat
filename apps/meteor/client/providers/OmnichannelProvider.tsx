import {
	type IOmnichannelAgent,
	type OmichannelRoutingConfig,
	OmnichannelSortingMechanismSettingType,
	LivechatInquiryStatus,
} from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { createComparatorFromSort } from '@rocket.chat/mongo-adapter';
import { useUser, useSetting, usePermission, useMethod, useEndpoint, useStream, useCustomSound } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState, useEffect, useMemo, memo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';

import { initializeLivechatInquiryStream } from '../../app/livechat/client/lib/stream/queueManager';
import { getOmniChatSortQuery } from '../../app/livechat/lib/inquiries';
import { ClientLogger } from '../../lib/ClientLogger';
import type { OmnichannelContextValue } from '../contexts/OmnichannelContext';
import { OmnichannelContext } from '../contexts/OmnichannelContext';
import { useHasLicenseModule } from '../hooks/useHasLicenseModule';
import { useLivechatInquiryStore } from '../hooks/useLivechatInquiryStore';
import { useOmnichannelContinuousSoundNotification } from '../hooks/useOmnichannelContinuousSoundNotification';
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

type OmnichannelProviderProps = {
	children?: ReactNode;
};

const OmnichannelProvider = ({ children }: OmnichannelProviderProps) => {
	const omniChannelEnabled = useSetting('Livechat_enabled', true);
	const omnichannelRouting = useSetting('Livechat_Routing_Method', 'Auto_Selection');
	const showOmnichannelQueueLink = useSetting('Livechat_show_queue_list_link', false);
	const omnichannelPoolMaxIncoming = useSetting('Livechat_guest_pool_max_number_incoming_livechats_displayed', 0);
	const omnichannelSortingMechanism = useSetting<OmnichannelSortingMechanismSettingType>(
		'Omnichannel_sorting_mechanism',
		OmnichannelSortingMechanismSettingType.Timestamp,
	);

	const lastQueueSize = useRef(0);

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
	const subscribe = useStream('notify-logged');
	const queryClient = useQueryClient();
	const isPrioritiesEnabled = isEnterprise && accessible;
	const enabled = accessible && !!user && !!routeConfig;

	const { notificationSounds } = useCustomSound();

	const {
		data: { priorities = [] } = {},
		isLoading: isLoadingPriorities,
		isError: isErrorPriorities,
	} = useQuery({
		queryKey: ['/v1/livechat/priorities'],
		queryFn: () => getPriorities({ sort: JSON.stringify({ sortItem: 1 }) }),
		staleTime: Infinity,
		enabled: isPrioritiesEnabled,
	});

	const isOverMacLimit = useShouldPreventAction('monthlyActiveContacts');

	useEffect(() => {
		if (!isPrioritiesEnabled) {
			return;
		}

		return subscribe('omnichannel.priority-changed', () => {
			queryClient.invalidateQueries({
				queryKey: ['/v1/livechat/priorities'],
			});
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
		if (!user?._id) {
			return;
		}
		return streamNotifyUser(`${user._id}/departmentAgentData`, handleDepartmentAgentData);
	}, [manuallySelected, streamNotifyUser, user?._id]);

	const queue = useLivechatInquiryStore(
		useShallow((state) => {
			if (!manuallySelected) {
				return undefined;
			}

			return state.records
				.filter((inquiry) => inquiry.status === LivechatInquiryStatus.QUEUED)
				.sort(createComparatorFromSort(getOmniChatSortQuery(omnichannelSortingMechanism)))
				.slice(...(omnichannelPoolMaxIncoming > 0 ? [0, omnichannelPoolMaxIncoming] : []));
		}),
	);

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
