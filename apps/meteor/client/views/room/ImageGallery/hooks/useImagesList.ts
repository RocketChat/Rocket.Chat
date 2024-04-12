import type { RoomsImagesProps } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';

import { useScrollableRecordList } from '../../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../../hooks/useComponentDidUpdate';
import { ImagesList } from '../../../../lib/lists/ImagesList';

export const useImagesList = (
	options: RoomsImagesProps,
): {
	filesList: ImagesList;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number) => void;
} => {
	const [filesList, setFilesList] = useState(() => new ImagesList(options));
	const reload = useCallback(() => setFilesList(new ImagesList(options)), [options]);

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	useEffect(() => {
		if (filesList.options !== options) {
			filesList.updateFilters(options);
		}
	}, [filesList, options]);

	const apiEndPoint = '/v1/rooms.images';

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

	return {
		reload,
		filesList,
		loadMoreItems,
		initialItemCount,
	};
};
