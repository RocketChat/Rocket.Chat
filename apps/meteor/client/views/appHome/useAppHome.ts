import { useEndpoint } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useUiKitActionManager } from '../../hooks/uikit/useUiKitActionManager';
import { homeUpdateEventName } from '../../lib/ActionManager';

/** Opens an app's home and keeps it current with what the app publishes while it is open. */
export const useAppHome = (appId: string) => {
	const openHome = useEndpoint('POST', '/v1/apps.home.open');
	const actionManager = useUiKitActionManager();
	const [published, setPublished] = useState<UiKit.HomeView>();

	// Listening before the request, so a publish answering appHomeOpened is never missed.
	useEffect(() => {
		const eventName = homeUpdateEventName(appId);
		const handleUpdate = ({ view }: { view: UiKit.HomeView }) => setPublished(view);

		actionManager.on(eventName, handleUpdate);

		return () => actionManager.off(eventName, handleUpdate);
	}, [actionManager, appId]);

	const { data, isPending, isError } = useQuery({
		queryKey: ['apps', appId, 'home'],
		queryFn: async () => (await openHome({ appId })).view,
		gcTime: 0,
		refetchOnWindowFocus: false,
	});

	return { view: published ?? data, isPending, isError };
};
