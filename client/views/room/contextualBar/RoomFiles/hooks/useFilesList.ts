import { useCallback, useEffect, useMemo, useState } from 'react';

import {
	FilesList,
	FilesListOptions,
} from '../../../../../lib/lists/FilesList';
import { useEndpoint } from '../../../../../contexts/ServerContext';
import { useUserRoom, useUserId } from '../../../../../contexts/UserContext';
import { useScrollableMessageList } from '../../../../../hooks/lists/useScrollableMessageList';
import { useStreamUpdatesForMessageList } from '../../../../../hooks/lists/useStreamUpdatesForMessageList';
import { getConfig } from '../../../../../../app/ui-utils/client/config';

export const useFilesList = (
	options: FilesListOptions,
): {
		filesList: FilesList;
		initialItemCount: number;
		loadMoreItems: (start: number, end: number) => void;
	} => {
	const [filesList] = useState(() => new FilesList(options));

	const room = useUserRoom(options.rid);
	const uid = useUserId();

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
	} as const;

	const apiEndPoint = room ? roomTypes[room.t] : 'channels.files';

	const getFiles = useEndpoint('GET', apiEndPoint);

	const fetchMessages = useCallback(
		async (start, end) => {
			const { files, total } = await getFiles({
				roomId: options.rid,
				count: end - start,
				sort: JSON.stringify({ uploadedAt: -1 }),
				query: JSON.stringify({
					name: { $regex: options.text || '', $options: 'i' },
					...options.type !== 'all' && {
						typeGroup: options.type,
					},
				}),
			});

			return {
				items: files,
				itemCount: total,
			};
		},
		[getFiles, options.rid, options.type, options.text],
	);

	const { loadMoreItems, initialItemCount } = useScrollableMessageList(
		filesList,
		fetchMessages,
		useMemo(() => {
			const filesListSize = getConfig('discussionListSize');
			return filesListSize ? parseInt(filesListSize, 10) : undefined;
		}, []),
	);
	useStreamUpdatesForMessageList(filesList, uid, options.rid);

	return {
		filesList,
		loadMoreItems,
		initialItemCount,
	};
};
