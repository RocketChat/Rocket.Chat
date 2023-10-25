import { useUserRoom, useUserId, useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { useStreamUpdatesForMessageList } from '../../../hooks/lists/useStreamUpdatesForMessageList';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
// import type { FilesListOptions } from '../../../lib/lists/FilesList';
import { FilesList } from '../../../lib/lists/FilesList';
import type { MessageList } from '../../../lib/lists/MessageList';
// import { getConfig } from '../../../lib/utils/getConfig';

export const useGalleryList = ({
	rid,
	name,
	url,
}: any): {
	filesList: FilesList;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const options = useMemo(() => ({ rid, type: 'image', text: '' }), [rid]);

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
			console.log(start, end, url);
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
			// http://localhost:3000/ufs/GridFS:Uploads/65243e6f0ceb6de1166812a6/Clipboard%20-%20October%209,%202023%2014:54.png
			// /ufs/GridFS:Uploads/65243e6f0ceb6de1166812a6/Clipboard%20-%20October%209,%202023%2014:54.png

			console.log('files', files);
			return {
				items: files.map((file) => ({
					...file,
					uploadedAt: file.uploadedAt ? new Date(file.uploadedAt) : undefined,
					modifiedAt: file.modifiedAt ? new Date(file.modifiedAt) : undefined,
				})),
				itemCount: total,
			};
		},
		[url, getFiles, options.rid, options.text, options.type],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(filesList, fetchMessages, 10);

	// TODO: chapter day : frontend create useStreamUpdatesForUploadList
	useStreamUpdatesForMessageList(filesList as unknown as MessageList, uid, options.rid || null);

	return {
		reload,
		filesList,
		loadMoreItems,
		initialItemCount,
	};
};
