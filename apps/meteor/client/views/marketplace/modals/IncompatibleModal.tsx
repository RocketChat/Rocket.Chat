import type { App } from '@rocket.chat/core-typings';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import IframeModal from '../IframeModal';
import { useAppsOrchestrator } from '../hooks/useAppsOrchestrator';

type IncompatibleModalProps = {
	app: App;
	action: 'subscribe' | 'update';
	onDismiss: () => void;
};

const IncompatibleModal = ({ app, action, onDismiss }: IncompatibleModalProps) => {
	const appsOrchestrator = useAppsOrchestrator();

	const { isSuccess, data: url } = useQuery({
		queryKey: ['marketplace', 'apps', { appId: app.id }, 'incompatible-url'] as const,
		queryFn: async () => {
			const data = await appsOrchestrator.buildIncompatibleExternalUrl(app.id, app.marketplaceVersion, action);
			return data.url;
		},
	});

	if (!isSuccess) {
		return null;
	}

	return <IframeModal url={url} confirm={onDismiss} cancel={onDismiss} />;
};

export default IncompatibleModal;
