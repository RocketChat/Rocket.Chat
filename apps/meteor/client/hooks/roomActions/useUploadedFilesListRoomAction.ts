import { lazy, useEffect } from 'react';

import { ui } from '../../lib/ui';

const RoomFiles = lazy(() => import('../../views/room/contextualBar/RoomFiles'));

export const useUploadedFilesListRoomAction = () => {
	useEffect(() => {
		return ui.addRoomAction('uploaded-files-list', {
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'live', 'team'],
			id: 'uploaded-files-list',
			title: 'Files',
			icon: 'clip',
			template: RoomFiles,
			order: 7,
		});
	}, []);
};
