import type { App } from '@rocket.chat/core-typings';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import IframeModal from '../IframeModal';
import { useAppsOrchestrator } from '../hooks/useAppsOrchestrator';

type PurchaseAppModalProps = {
	app: App;
	onPurchase: () => void;
	onDismiss: () => void;
};

const PurchaseAppModal = ({ app, onPurchase, onDismiss }: PurchaseAppModalProps) => {
	const appsOrchestrator = useAppsOrchestrator();

	const { isSuccess, data: url } = useQuery({
		queryKey: ['marketplace', 'apps', { appId: app.id }, 'purchase-url'] as const,
		queryFn: async () => {
			const data = await appsOrchestrator.buildExternalUrl(app.id, app.purchaseType, false);
			return data.url;
		},
	});

	if (!isSuccess) {
		return null;
	}

	return <IframeModal url={url} cancel={onDismiss} confirm={onPurchase} />;
};

export default PurchaseAppModal;
