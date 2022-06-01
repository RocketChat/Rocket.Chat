import { useUserRoom, useUserId, useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useScrollableRecordList } from '../../../../../hooks/lists/useScrollableRecordList';
import { useStreamUpdatesForMessageList } from '../../../../../hooks/lists/useStreamUpdatesForMessageList';
import { useComponentDidUpdate } from '../../../../../hooks/useComponentDidUpdate';
import { FilesList, FilesListOptions } from '../../../../../lib/lists/FilesList';
import { MessageList } from '../../../../../lib/lists/MessageList';
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
	const room = useUserRoom(options.rid as string);
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
		c: 'channels.files',
		l: 'channels.files',
		v: 'channels.files',
		d: 'im.files',
		p: 'groups.files',
	} as const;

	const apiEndPoint = room ? roomTypes[room.t] : 'channels.files';

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
				items: files.map((file) => ({
					...file,
					_updatedAt: new Date(file._updatedAt),
				})),
				itemCount: total,
			};
		},
		[getFiles, options.rid, options.type, options.text],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(
		filesList,
		fetchMessages,
		useMemo(() => {
			const filesListSize = getConfig('discussionListSize');
			return filesListSize ? parseInt(filesListSize, 10) : undefined;
		}, []),
	);

	// TODO: chapter day : frontend create useStreamUpdatesForUploadList
	useStreamUpdatesForMessageList(filesList as unknown as MessageList, uid, options.rid || null);

	return {
		reload,
		filesList,
		loadMoreItems,
		initialItemCount,
	};
};
