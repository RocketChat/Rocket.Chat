import type { App } from '@rocket.chat/core-typings';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import type { IAppsOrchestrator } from '../AppsOrchestratorContext';
import IframeModal from '../IframeModal';
import { marketplaceQueryKeys } from '../queryKeys';

type PurchaseAppModalProps = {
	app: App;
	appsOrchestrator: IAppsOrchestrator;
	onPurchase: () => void;
	onClose: () => void;
};

const PurchaseAppModal = ({ app, appsOrchestrator, onPurchase, onClose }: PurchaseAppModalProps) => {
	const { isSuccess, data: url } = useQuery({
		queryKey: marketplaceQueryKeys.app.urls.purchase(app.id),
		queryFn: async () => {
			const data = await appsOrchestrator.buildExternalUrl(app.id, app.purchaseType, false);
			return data.url;
		},
	});

	if (!isSuccess) {
		return <div />; // FIXME: @react-aria/focus bug
	}

	return <IframeModal url={url} cancel={onClose} confirm={onPurchase} />;
};

export default PurchaseAppModal;
