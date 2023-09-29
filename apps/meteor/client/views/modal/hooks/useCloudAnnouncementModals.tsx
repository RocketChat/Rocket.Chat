import type { Cloud, Serialized, UiKit } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';

import { useCloudAnnouncementsQuery } from '../../../hooks/useCloudAnnouncementsQuery';
import UiKitModal from '../uikit/UiKitModal';

const isModalCarryingAnnouncement = (
	announcement: Serialized<Cloud.Announcement>,
): announcement is Serialized<Cloud.Announcement & { surface: 'modal'; view: UiKit.ModalView }> => announcement.surface === 'modal';

export const useCloudAnnouncementModals = () => {
	const queryResult = useCloudAnnouncementsQuery({
		select: (announcements) => announcements.filter(isModalCarryingAnnouncement),
	});

	const setModal = useSetModal();

	useEffect(() => {
		if (!queryResult.isSuccess) {
			return;
		}

		for (const announcement of queryResult.data) {
			setModal(<UiKitModal key={announcement.view.viewId} initialView={announcement.view} />);
		}
	}, [queryResult.data, queryResult.isSuccess, setModal]);
};
