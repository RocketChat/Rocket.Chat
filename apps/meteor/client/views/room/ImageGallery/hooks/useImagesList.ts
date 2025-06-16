import { Base64 } from '@rocket.chat/base64';
import type { RoomsImagesProps } from '@rocket.chat/rest-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';

import { e2e } from '../../../../../app/e2e/client/rocketchat.e2e';
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
		async (start: number, end: number) => {
			const { files, total } = await getFiles({
				roomId: options.roomId,
				startingFromId: options.startingFromId,
				offset: start,
				count: end,
			});

			const items = files.map((file) => ({
				...file,
				uploadedAt: file.uploadedAt ? new Date(file.uploadedAt) : undefined,
				modifiedAt: file.modifiedAt ? new Date(file.modifiedAt) : undefined,
			}));

			for await (const file of items) {
				if (file.rid && file.content) {
					const e2eRoom = await e2e.getInstanceByRoomId(file.rid);
					if (e2eRoom?.shouldConvertReceivedMessages()) {
						const decrypted = await e2e.decryptFileContent(file);
						const key = Base64.encode(
							JSON.stringify({
								...decrypted.encryption,
								name: String.fromCharCode(...new TextEncoder().encode(decrypted.name)),
								type: decrypted.type,
							}),
						);
						decrypted.path = `/file-decrypt${decrypted.path}?key=${key}`;
						Object.assign(file, decrypted);
					}
				}
			}

			return {
				items,
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
