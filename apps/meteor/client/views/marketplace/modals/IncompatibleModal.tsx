import type { App } from '@rocket.chat/core-typings';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import type { IAppsOrchestrator } from '../AppsOrchestratorContext';
import IframeModal from '../IframeModal';
import { marketplaceQueryKeys } from '../queryKeys';

type IncompatibleModalProps = {
	app: App;
	appsOrchestrator: IAppsOrchestrator;
	action: 'subscribe' | 'update';
	onClose: () => void;
};

const IncompatibleModal = ({ app, appsOrchestrator, action, onClose }: IncompatibleModalProps) => {
	const { isSuccess, data: url } = useQuery({
		queryKey: marketplaceQueryKeys.app.urls.incompatible(app.id),
		queryFn: async () => {
			const data = await appsOrchestrator.buildIncompatibleExternalUrl(app.id, app.marketplaceVersion, action);
			return data.url;
		},
	});

	if (!isSuccess) {
		return <div />; // FIXME: @react-aria/focus bug
	}

	return <IframeModal url={url} confirm={onClose} cancel={onClose} />;
};

export default IncompatibleModal;
