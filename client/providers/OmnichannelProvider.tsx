import React, { useState, useEffect, FC, useMemo, useCallback, memo, useRef } from 'react';

import { LivechatInquiry } from '../../app/livechat/client/collections/LivechatInquiry';
import { initializeLivechatInquiryStream } from '../../app/livechat/client/lib/stream/queueManager';
import { Notifications } from '../../app/notifications/client';
import { APIClient } from '../../app/utils/client/lib/RestApiClient';
import { IOmnichannelAgent } from '../../definition/IOmnichannelAgent';
import { IRoom } from '../../definition/IRoom';
import { OmichannelRoutingConfig } from '../../definition/OmichannelRoutingConfig';
import { ClientLogger } from '../../lib/ClientLogger';
import { IRegistrationInfo } from '../components/voip/IRegistrationInfo';
import { SimpleVoipUser } from '../components/voip/SimpleVoipUser';
import { VoIPUser } from '../components/voip/VoIPUser';
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
	voipUser: undefined,
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

	const [extensionConfig, setExtensionConfig] = useState<IRegistrationInfo | undefined>(undefined);

	const [voipUser, setVoipUser] = useState<VoIPUser | undefined>(undefined);

	const accessible = hasAccess && omniChannelEnabled;
	const iceServersSetting: any = useSetting('WebRTC_Servers');

	useEffect(() => {
		if (!accessible) {
			return;
		}
		const initVoipLib = async (): Promise<void> => {
			/* Init extension */
			try {
				if (extensionConfig) {
					return;
				}
				const extension = '80000';
				const extensionConfigLocal = (await APIClient.v1.get(
					'connector.extension.getRegistrationInfo',
					{
						extension,
					},
				)) as unknown as IRegistrationInfo; // TODO use endpointdata
				const iceServers: Array<object> = [];
				if (iceServersSetting && iceServersSetting.trim() !== '') {
					const serversListStr = iceServersSetting.replace(/\s/g, '');
					const serverList = serversListStr.split(',');
					serverList.forEach((server: any) => {
						server = server.split('@');
						const serverConfig: any = {
							urls: server.pop(),
						};
						if (server.length === 1) {
							server = server[0].split(':');
							serverConfig.username = decodeURIComponent(server[0]);
							serverConfig.credential = decodeURIComponent(server[1]);
						}
						iceServers.push(serverConfig);
					});
				}
				loggerRef.current.debug(JSON.stringify(iceServers));
				setVoipUser(
					await SimpleVoipUser.create(
						extensionConfigLocal.extensionDetails.extension,
						extensionConfigLocal.extensionDetails.password,
						extensionConfigLocal.host,
						extensionConfigLocal.callServerConfig.websocketPath,
						iceServers,
						'video',
					),
				);
				setExtensionConfig(extensionConfigLocal);
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
			return;
		}
		setVoipUser(undefined);
		setExtensionConfig(undefined);
	}, [
		accessible,
		extensionConfig,
		getRoutingConfig,
		iceServersSetting,
		omnichannelRouting,
		voipCallAvailable,
	]);

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
				registrationConfig: extensionConfig,
			} as OmnichannelContextValue;
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
			registrationConfig: extensionConfig,
		} as OmnichannelContextValue;
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
