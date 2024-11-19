import type { App } from '@rocket.chat/core-typings';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import IframeModal from '../IframeModal';
import { useAppsOrchestrator } from '../hooks/useAppsOrchestrator';
import { marketplaceQueryKeys } from '../queryKeys';

type PurchaseAppModalProps = {
	app: App;
	onPurchase: () => void;
	onClose: () => void;
};

const PurchaseAppModal = ({ app, onPurchase, onClose }: PurchaseAppModalProps) => {
	const appsOrchestrator = useAppsOrchestrator();

	const { isSuccess, data: url } = useQuery({
		queryKey: marketplaceQueryKeys.app.urls.purchase(app.id),
		queryFn: async () => {
			const data = await appsOrchestrator.buildExternalUrl(app.id, app.purchaseType, false);
			return data.url;
		},
	});

	if (!isSuccess) {
		return null;
	}

	return <IframeModal url={url} cancel={onClose} confirm={onPurchase} />;
};

export default PurchaseAppModal;
