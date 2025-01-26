import { Base64 } from '@rocket.chat/base64';
import { useUserRoom, useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { e2e } from '../../../../../../app/e2e/client/rocketchat.e2e';
import { useScrollableRecordList } from '../../../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../../../hooks/useComponentDidUpdate';
import type { FilesListOptions } from '../../../../../lib/lists/FilesList';
import { FilesList } from '../../../../../lib/lists/FilesList';
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
		async (start: number, end: number) => {
			const { files, total } = await getFiles({
				roomId: options.rid,
				offset: start,
				count: end,
				sort: JSON.stringify({ uploadedAt: -1 }),
				...(options.text ? { name: options.text } : {}),
				...(options.type !== 'all' && {
					typeGroup: options.type,
				}),
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
		[getFiles, options.rid, options.type, options.text],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(
		filesList,
		fetchMessages,
		useMemo(() => parseInt(`${getConfig('discussionListSize', 10)}`), []),
	);

	return {
		reload,
		filesList,
		loadMoreItems,
		initialItemCount,
	};
};
