import { Base64 } from '@rocket.chat/base64';
import { useUserRoom, useUserId, useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { e2e } from '../../../../../../app/e2e/client/rocketchat.e2e';
import { useScrollableRecordList } from '../../../../../hooks/lists/useScrollableRecordList';
import { useStreamUpdatesForMessageList } from '../../../../../hooks/lists/useStreamUpdatesForMessageList';
import { useComponentDidUpdate } from '../../../../../hooks/useComponentDidUpdate';
import type { FilesListOptions } from '../../../../../lib/lists/FilesList';
import { FilesList } from '../../../../../lib/lists/FilesList';
import type { MessageList } from '../../../../../lib/lists/MessageList';
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

	// TODO: chapter day : frontend create useStreamUpdatesForUploadList
	useStreamUpdatesForMessageList(filesList as unknown as MessageList, uid, options.rid || null);

	return {
		reload,
		filesList,
		loadMoreItems,
		initialItemCount,
	};
};
