import { useUserRoom, useUserId, useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useScrollableMessageList } from '../../../../../hooks/lists/useScrollableMessageList';
import { useStreamUpdatesForMessageList } from '../../../../../hooks/lists/useStreamUpdatesForMessageList';
import { useComponentDidUpdate } from '../../../../../hooks/useComponentDidUpdate';
import { FilesList, FilesListOptions } from '../../../../../lib/lists/FilesList';
import { getConfig } from '../../../../../lib/utils/getConfig';

export const useFilesList = (
	options: FilesListOptions,
): {
	filesList: FilesList;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const [filesList, setFilesList] = useState(() => new FilesList(options));
	const reload = useCallback(() => setFilesList(new FilesList(options)), [options]);
	const room = useUserRoom(options.rid);
	const uid = useUserId();

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	useEffect(() => {
		if (filesList.options !== options) {
			filesList.updateFilters(options);
		}
	}, [filesList, options]);

	const roomTypes = {
		c: '/v1/channels.files',
		l: '/v1/channels.files',
		v: '/v1/channels.files',
		d: '/v1/im.files',
		p: '/v1/groups.files',
	} as const;

	const apiEndPoint = room ? roomTypes[room.t] : '/v1/channels.files';

	const getFiles = useEndpoint('GET', apiEndPoint);

	const fetchMessages = useCallback(
		async (start, end) => {
			const { files, total } = await getFiles({
				roomId: options.rid,
				offset: start,
				count: end,
				sort: JSON.stringify({ uploadedAt: -1 }),
				query: JSON.stringify({
					name: { $regex: options.text || '', $options: 'i' },
					...(options.type !== 'all' && {
						typeGroup: options.type,
					}),
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
		reload,
		filesList,
		loadMoreItems,
		initialItemCount,
	};
};
