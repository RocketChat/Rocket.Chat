import { Base64 } from '@rocket.chat/base64';
import type { IUpload } from '@rocket.chat/core-typings';
import { useUserRoom, useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

import { e2e } from '../../../../../lib/e2ee/rocketchat.e2e';
import { roomsQueryKeys } from '../../../../../lib/queryKeys';
import { getConfig } from '../../../../../lib/utils/getConfig';

export const useFilesList = ({ rid, type, text }: { rid: Required<IUpload>['rid']; type: string; text: string }) => {
	const room = useUserRoom(rid);

	const roomTypes = {
		c: '/v1/channels.files',
		l: '/v1/channels.files',
		v: '/v1/channels.files',
		d: '/v1/im.files',
		p: '/v1/groups.files',
	} as const;

	const getFiles = useEndpoint('GET', roomTypes[room?.t ?? 'c']);

	const count = parseInt(`${getConfig('discussionListSize', 10)}`, 10);

	return useInfiniteQuery({
		queryKey: roomsQueryKeys.files(rid, { type, text }),
		queryFn: async ({ pageParam: offset }) => {
			const { files, total } = await getFiles({
				roomId: rid,
				offset,
				count,
				sort: JSON.stringify({ uploadedAt: -1 }),
				...(text ? { name: text } : {}),
				...(type !== 'all' && {
					typeGroup: type,
				}),
				onlyConfirmed: true,
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
		initialPageParam: 0,
		getNextPageParam: (lastPage, _, lastOffset) => {
			const nextOffset = lastOffset + count;
			if (nextOffset >= lastPage.itemCount) return undefined;
			return nextOffset;
		},
		select: ({ pages }) => ({
			filesItems: pages.flatMap((page) => page.items),
			total: pages.at(-1)?.itemCount,
		}),
	});
};
