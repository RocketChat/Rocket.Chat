import type { UiKit } from '@rocket.chat/core-typings';
import { useEndpoint, useUserId } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useUiKitActionManager } from '../../../uikit/hooks/useUiKitActionManager';

export const useCloudAnnouncements = () => {
	const uid = useUserId();

	const getAnnouncements = useEndpoint('GET', '/v1/cloud.announcements');

	const actionManager = useUiKitActionManager();

	const { data: firstModalAnnouncement } = useQuery({
		queryKey: ['cloud', 'announcements'],
		queryFn: () => getAnnouncements(),
		select: (data) => data.announcements.filter((announcement) => announcement.surface === 'modal')[0],
		enabled: !!uid,
	});

	useEffect(() => {
		if (!firstModalAnnouncement) {
			return;
		}

		const view = firstModalAnnouncement.view as UiKit.ModalView;

		actionManager.openView('modal', view);

		return () => {
			actionManager.disposeView(view.id);
		};
	}, [firstModalAnnouncement, actionManager]);

	const { data: firstBannerAnnouncement } = useQuery({
		queryKey: ['cloud', 'announcements'],
		queryFn: () => getAnnouncements(),
		select: (data) => data.announcements.filter((announcement) => announcement.surface === 'banner')[0],
		enabled: !!uid,
	});

	useEffect(() => {
		if (!firstBannerAnnouncement) {
			return;
		}

		const view = firstBannerAnnouncement.view as UiKit.BannerView;

		actionManager.openView('banner', view);

		return () => {
			actionManager.disposeView(view.viewId);
		};
	}, [firstBannerAnnouncement, actionManager]);
};
