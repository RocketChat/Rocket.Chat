import type { App } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import IframeModal from '../IframeModal';
import { useSyncAppMutation } from '../hooks/useSyncAppMutation';

type ModifySubscriptionModalProps = {
	app: App;
	onDismiss: () => void;
};

const ModifySubscriptionModal = ({ app, onDismiss }: ModifySubscriptionModalProps) => {
	const syncAppMutation = useSyncAppMutation(app);

	const handleConfirm = () => {
		syncAppMutation.mutate();
	};

	const buildExternalUrl = useEndpoint('GET', '/apps');

	const { isSuccess, data: url } = useQuery({
		queryKey: ['marketplace', 'apps', { appId: app.id }, 'subscription-url'] as const,
		queryFn: async () => {
			const data = (await buildExternalUrl({
				buildExternalUrl: 'true',
				appId: app.id,
				purchaseType: app.purchaseType,
				details: 'true',
			})) as { url: string };

			return data.url;
		},
	});

	if (!isSuccess) {
		return null;
	}

	return <IframeModal url={url} confirm={handleConfirm} cancel={onDismiss} />;
};

export default ModifySubscriptionModal;
