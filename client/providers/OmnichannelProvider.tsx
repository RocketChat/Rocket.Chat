import React, { useState, useEffect, FC, useMemo, useCallback, memo, useRef } from 'react';

import { LivechatInquiry } from '../../app/livechat/client/collections/LivechatInquiry';
import { initializeLivechatInquiryStream } from '../../app/livechat/client/lib/stream/queueManager';
import { Notifications } from '../../app/notifications/client';
import { APIClient } from '../../app/utils/client/lib/RestApiClient';
import { IOmnichannelAgent } from '../../definition/IOmnichannelAgent';
import { IRoom } from '../../definition/IRoom';
import { OmichannelRoutingConfig } from '../../definition/OmichannelRoutingConfig';
import { ClientLogger } from '../../lib/ClientLogger';
import { IExtensionConfig } from '../components/voip/IExtensionConfig';
import { CallType, SimpleVoipUser } from '../components/voip/SimpleVoipUser';
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
	voipCallAvailable: false,
	showOmnichannelQueueLink: false,
};

const OmnichannelProvider: FC = ({ children }) => {
	const omniChannelEnabled = useSetting('Livechat_enabled') as boolean;
	const omnichannelRouting = useSetting('Livechat_Routing_Method');
	const showOmnichannelQueueLink = useSetting('Livechat_show_queue_list_link') as boolean;
	const omnichannelPoolMaxIncoming = useSetting(
		'Livechat_guest_pool_max_number_incoming_livechats_displayed',
	) as number;

	const loggerRef = useRef(new ClientLogger('OmnichannelProvider'));
	const hasAccess = usePermission('view-l-room');
	const canViewOmnichannelQueue = usePermission('view-livechat-queue');

	const user = useUser() as IOmnichannelAgent;

	const agentAvailable = user?.statusLivechat === 'available';
	const voipCallAvailable = true; // TODO: use backend check;

	const getRoutingConfig = useMethod('livechat:getRoutingConfig');

	const [routeConfig, setRouteConfig] = useState<OmichannelRoutingConfig | undefined>(undefined);

	const [extensionConfig, setExtensionConfig] = useState<IExtensionConfig | undefined>(undefined);

	const [voipUser, setVoipUser] = useState<SimpleVoipUser | undefined>(undefined);

	const accessible = hasAccess && omniChannelEnabled;

	useEffect(() => {
		if (!accessible) {
			return;
		}
		const initVoipLib = async (): Promise<void> => {
			/* Init extension */
			let extensionConfig = undefined;
			let voipUser: SimpleVoipUser;
			const extension = '80000';
			try {
				if (extensionConfig) {
					return;
				}
				extensionConfig = (await APIClient.v1.get('connector.extension.getRegistrationInfo', {
					extension,
				})) as unknown as IExtensionConfig;
				setExtensionConfig(extensionConfig);
				voipUser = new SimpleVoipUser(
					extensionConfig.extension,
					extensionConfig.password,
					extensionConfig.sipRegistrar,
					extensionConfig.websocketUri,
					CallType.AUDIO_VIDEO,
				);
				await voipUser.initUserAgent();
				setVoipUser(voipUser);
			} catch (error) {
				loggerRef.current.error(`initVoipLib() error in initialising ${error}`);
			}
		};
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
		if (voipCallAvailable) {
			initVoipLib();
		}
	}, [accessible, getRoutingConfig, omnichannelRouting, voipCallAvailable]);

	const enabled = accessible && !!user && !!routeConfig && !!extensionConfig && !!voipUser;
	const manuallySelected =
		enabled &&
		canViewOmnichannelQueue &&
		!!routeConfig &&
		routeConfig.showQueue &&
		!routeConfig.autoAssignAgent &&
		agentAvailable &&
		!!extensionConfig &&
		!!voipUser;

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
				voipCallAvailable,
				routeConfig,
				voipUser,
				extensionConfig,
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
			voipUser,
			extensionConfig,
		};
	}, [
		agentAvailable,
		voipCallAvailable,
		enabled,
		manuallySelected,
		queue,
		routeConfig,
		showOmnichannelQueueLink,
		voipUser,
		extensionConfig,
	]);

	return <OmnichannelContext.Provider children={children} value={contextValue} />;
};

export default memo<typeof OmnichannelProvider>(OmnichannelProvider);
