import type { ILivechatTag } from '@rocket.chat/core-typings';
import { ContextualbarSkeletonBody } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import TagEdit from './TagEdit';
import TagEditWithDepartmentData from './TagEditWithDepartmentData';
import NotAvailableCallout from '../components/NotAvailableCallout';

const TagEditWithData = ({ tagId, onClose }: { tagId: ILivechatTag['_id']; onClose: () => void }) => {
	const getTagById = useEndpoint('GET', '/v1/livechat/tags/:tagId', { tagId });
	const { data, isPending, isError } = useQuery({
		queryKey: ['livechat-getTagById', tagId],
		queryFn: async () => getTagById(),
		refetchOnWindowFocus: false,
	});

	if (isPending) {
		return <ContextualbarSkeletonBody />;
	}

	if (isError) {
		return <NotAvailableCallout />;
	}

	if (data?.departments && data.departments.length > 0) {
		return <TagEditWithDepartmentData tagData={data} onClose={onClose} />;
	}

	return <TagEdit tagData={data} onClose={onClose} />;
};

export default TagEditWithData;
