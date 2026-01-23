import { Base64 } from '@rocket.chat/base64';
import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

import { e2e } from '../../../../lib/e2ee/rocketchat.e2e';
import { roomsQueryKeys } from '../../../../lib/queryKeys';

export const useImagesList = ({ roomId, startingFromId }: { roomId: IRoom['_id']; startingFromId?: string }) => {
	const getFiles = useEndpoint('GET', '/v1/rooms.images');

	const count = 5;

	return useInfiniteQuery({
		queryKey: roomsQueryKeys.images(roomId, { startingFromId }),
		queryFn: async ({ pageParam: offset }) => {
			const { files, total } = await getFiles({
				roomId,
				startingFromId,
				offset,
				count,
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
		// Remove duplicates while preserving order
		select: ({ pages }) => Array.from(new Map(pages.flatMap((page) => page.items.map((item) => [item._id, item]))).values()),
	});
};
