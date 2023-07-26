import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

// TODO: Remove this hook when the endpoint is changed
// to return labels instead of tag id's
export const useTagsLabels = (initialTags: string[] = []) => {
	const getTags = useEndpoint('GET', '/v1/livechat/tags');
	const { data: tagsData, isInitialLoading } = useQuery(['/v1/livechat/tags'], () => getTags({ text: '' }), {
		enabled: Boolean(initialTags.length),
	});

	const labels = useMemo(() => {
		const { tags = [] } = tagsData || {};
		return tags.reduce<Record<string, string>>((acc, tag) => ({ ...acc, [tag._id]: tag.name }), {});
	}, [tagsData]);

	return useMemo(() => {
		return isInitialLoading ? initialTags : initialTags.map((tag) => labels[tag] || tag);
	}, [initialTags, isInitialLoading, labels]);
};
