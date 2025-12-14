import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

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
