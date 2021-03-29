import React, { useState, useEffect, FC } from 'react';

import { IOmnichannelAgent } from '../../definition/IOmnichannelAgent';
import { OmichannelRoutingConfig } from '../../definition/OmichannelRoutingConfig';
import { usePermission } from '../contexts/AuthorizationContext';
import { OmnichannelContext, OmnichannelContextValue } from '../contexts/OmnichannelContext';
import { useSetting } from '../contexts/SettingsContext';
import { useUser } from '../contexts/UserContext';
import { AsyncStatePhase } from '../hooks/useAsyncState';
import { useMethodData } from '../hooks/useMethodData';
import OmnichannelDisabledProvider from './OmnichannelDisabledProvider';
import OmnichannelManualSelectionProvider from './OmnichannelManualSelectionProvider';

const args = [] as any;

const emptyContext = {
	inquiries: { enabled: false },
	enabled: false,
	agentAvailable: false,
	showOmnichannelQueueLink: false,
} as OmnichannelContextValue;

const OmnichannelEnabledProvider: FC = ({ children }) => {
	const omnichannelRouting = useSetting('Livechat_Routing_Method');
	const [contextValue, setContextValue] = useState<OmnichannelContextValue>({
		...emptyContext,
		enabled: true,
	});

	const user = useUser() as IOmnichannelAgent;
	const { value: routeConfig, phase: status, reload } = useMethodData<OmichannelRoutingConfig>(
		'livechat:getRoutingConfig',
		args,
	);

	const canViewOmnichannelQueue = usePermission('view-livechat-queue');

	useEffect(() => {
		status !== AsyncStatePhase.LOADING && reload();
	}, [omnichannelRouting, reload]); // eslint-disable-line

	useEffect(() => {
		setContextValue((context) => ({
			...context,
			agentAvailable: user?.statusLivechat === 'available',
		}));
	}, [user?.statusLivechat, routeConfig]);

	if (!routeConfig || !user) {
		return <OmnichannelDisabledProvider children={children} />;
	}

	if (
		canViewOmnichannelQueue &&
		routeConfig.showQueue &&
		!routeConfig.autoAssignAgent &&
		contextValue.agentAvailable
	) {
		return <OmnichannelManualSelectionProvider value={contextValue} children={children} />;
	}

	return <OmnichannelContext.Provider value={contextValue} children={children} />;
};

export default OmnichannelEnabledProvider;
