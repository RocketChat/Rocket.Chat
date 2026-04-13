import type { ILivechatTag, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

type TagsListOptions = {
	filter: string;
	department?: string;
	viewAll?: boolean;
	limit?: number;
};

export type TagListItem = {
	_id: string;
	label: string;
	value: string;
};

const DEFAULT_QUERY_LIMIT = 25;

export const useTagsList = (options: TagsListOptions) => {
	const { viewAll, department, filter, limit = DEFAULT_QUERY_LIMIT } = options;

	const getTags = useEndpoint('GET', '/v1/livechat/tags');

	const formatTagItem = (tag: Serialized<ILivechatTag>): TagListItem => ({
		_id: tag._id,
		label: tag.name,
		value: tag.name,
	});

	return useInfiniteQuery({
		queryKey: ['/v1/livechat/tags', options],
		queryFn: async ({ pageParam: offset = 0 }) => {
			const { tags, ...data } = await getTags({
				text: filter,
				offset,
				count: limit,
				...(viewAll && { viewAll: 'true' }),
				...(department && { department }),
				sort: JSON.stringify({ name: 1 }),
			});

			return {
				...data,
				tags: tags.map(formatTagItem),
			};
		},
		select: (data) => data.pages.flatMap<TagListItem>((page) => page.tags),
		initialPageParam: 0,
		getNextPageParam: (lastPage) => {
			const offset = lastPage.offset + lastPage.count;
			return offset < lastPage.total ? offset : undefined;
		},
		initialData: () => ({
			pages: [{ tags: [], offset: 0, count: 0, total: Infinity }],
			pageParams: [0],
		}),
	});
};
