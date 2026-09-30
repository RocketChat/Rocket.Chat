import { type IOmnichannelAgent, OmnichannelSortingMechanismSettingType, LivechatInquiryStatus } from '@rocket.chat/core-typings';
import { createComparatorFromSort } from '@rocket.chat/mongo-adapter';
import { useUser, useSetting, usePermission, useEndpoint } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useMemo, memo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';

import { getOmniChatSortQuery } from '../../app/livechat/lib/inquiries';
import { ClientLogger } from '../../lib/ClientLogger';
import type { OmnichannelContextValue } from '../contexts/OmnichannelContext';
import { OmnichannelContext } from '../contexts/OmnichannelContext';
import { useHasLicenseModule } from '../hooks/useHasLicenseModule';
import { useLivechatInquiryStore } from '../hooks/useLivechatInquiryStore';
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

export type OmnichannelProviderProps = {
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

	const loggerRef = useRef(new ClientLogger('OmnichannelProvider'));
	const hasAccess = usePermission('view-l-room');
	const canViewOmnichannelQueue = usePermission('view-livechat-queue');
	const user = useUser() as IOmnichannelAgent;

	const agentAvailable = user?.statusLivechat === 'available';

	const getRoutingConfig = useEndpoint('GET', '/v1/livechat/config/routing');

	const accessible = hasAccess && omniChannelEnabled;

	const { data: routeConfig } = useQuery({
		queryKey: ['/v1/livechat/config/routing', omnichannelRouting],
		queryFn: async () => {
			try {
				const { config } = await getRoutingConfig();
				return config;
			} catch (error) {
				loggerRef.current.error(`update() error in routeConfig ${error}`);
				throw error;
			}
		},
		enabled: accessible,
		placeholderData: keepPreviousData,
	});
	const { data: isEnterprise = false } = useHasLicenseModule('livechat-enterprise');

	const getPriorities = useEndpoint('GET', '/v1/livechat/priorities');
	const isPrioritiesEnabled = isEnterprise && accessible;
	const enabled = accessible && !!user && !!routeConfig;

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

	const manuallySelected =
		enabled && canViewOmnichannelQueue && !!routeConfig && routeConfig.showQueue && !routeConfig.autoAssignAgent && agentAvailable;

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
		routeConfig,
		queue,
		showOmnichannelQueueLink,
		isOverMacLimit,
	]);

	return <OmnichannelContext.Provider value={contextValue}>{children}</OmnichannelContext.Provider>;
};

export default memo<typeof OmnichannelProvider>(OmnichannelProvider);
