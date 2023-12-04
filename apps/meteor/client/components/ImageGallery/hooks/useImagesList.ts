import type { ChannelsImagesProps } from '@rocket.chat/rest-typings';
import { useUserId, useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';

import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { useStreamUpdatesForMessageList } from '../../../hooks/lists/useStreamUpdatesForMessageList';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { ImagesList } from '../../../lib/lists/ImagesList';
import type { MessageList } from '../../../lib/lists/MessageList';

export const useImagesList = (
	options: ChannelsImagesProps,
): {
	filesList: ImagesList;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number) => void;
} => {
	const [filesList, setFilesList] = useState(() => new ImagesList(options));
	const reload = useCallback(() => setFilesList(new ImagesList(options)), [options]);
	const uid = useUserId();

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	useEffect(() => {
		if (filesList.options !== options) {
			filesList.updateFilters(options);
		}
	}, [filesList, options]);

	const apiEndPoint = '/v1/channels.images';

	const getFiles = useEndpoint('GET', apiEndPoint);

	const fetchMessages = useCallback(
		async (start, end) => {
			const { files, total } = await getFiles({
				roomId: options.roomId,
				startingFromId: options.startingFromId,
				offset: start,
				count: end,
			});

			return {
				items: files.map((file) => ({
					...file,
					uploadedAt: file.uploadedAt ? new Date(file.uploadedAt) : undefined,
					modifiedAt: file.modifiedAt ? new Date(file.modifiedAt) : undefined,
				})),
				itemCount: total,
			};
		},
		[getFiles, options.roomId, options.startingFromId],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(filesList, fetchMessages, 5);

	// TODO: chapter day : frontend create useStreamUpdatesForUploadList
	useStreamUpdatesForMessageList(filesList as unknown as MessageList, uid, options.roomId || null);

	return {
		reload,
		filesList,
		loadMoreItems,
		initialItemCount,
	};
};
