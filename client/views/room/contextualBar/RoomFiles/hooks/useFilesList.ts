import { useCallback, useEffect, useMemo, useState } from 'react';

import {
	FilesList,
	FilesListOptions,
} from '../../../../../lib/lists/FilesList';
import { useEndpoint } from '../../../../../contexts/ServerContext';
import { useUserRoom } from '../../../../../contexts/UserContext';
import { useScrollableMessageList } from '../../../../../hooks/lists/useScrollableMessageList';
// import { useStreamUpdatesForMessageList } from '../../../../../hooks/lists/useStreamUpdatesForMessageList';
import { IRoom } from '../../../../../../definition/IRoom';
import { getConfig } from '../../../../../../app/ui-utils/client/config';

export const useFilesList = (
	options: FilesListOptions,
	rid: IRoom['_id'],
): {
		filesList: FilesList;
		initialItemCount: number;
		loadMoreItems: (start: number, end: number) => void;
	} => {
	const room = useUserRoom(rid);
	const [filesList] = useState(() => new FilesList(options));

	useEffect(() => {
		if (filesList.options !== options) {
			filesList.updateFilters(options);
		}
	}, [filesList, options]);

	const roomTypes = {
		c: 'channels.files',
		l: 'channels.files',
		d: 'im.files',
		p: 'groups.files',
	};

	const apiEndPoint = room && roomTypes[room.t];

	const getFiles = useEndpoint('GET', apiEndPoint as string);

	const fetchMessages = useCallback(
		async (start, end) => {
			const { messages, total } = await getFiles({
				roomId: options.rid,
				count: end - start,
			});

			return {
				items: messages,
				itemCount: total,
			};
		},
		[getFiles, options.rid],
	);

	const { loadMoreItems, initialItemCount } = useScrollableMessageList(
		filesList,
		fetchMessages,
		useMemo(() => {
			const filesListSize = getConfig('discussionListSize');
			return filesListSize ? parseInt(filesListSize, 10) : undefined;
		}, []),
	);
	// useStreamUpdatesForMessageList(filesList, uid, options.rid);

	return {
		filesList,
		loadMoreItems,
		initialItemCount,
	};
};
