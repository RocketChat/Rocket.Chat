import { lazy, useMemo } from 'react';

import type { RoomToolboxActionConfig } from '../../views/room/contexts/RoomToolboxContext';

const RoomFiles = lazy(() => import('../../views/room/contextualBar/RoomFiles'));

export const useUploadedFilesListRoomAction = () => {
	return useMemo((): RoomToolboxActionConfig => {
		return {
			id: 'uploaded-files-list',
			groups: ['channel', 'group', 'direct', 'direct_multiple', 'live', 'team'],
			title: 'Files',
			icon: 'clip',
			tabComponent: RoomFiles,
			order: 8,
			type: 'organization',
		};
	}, []);
};
