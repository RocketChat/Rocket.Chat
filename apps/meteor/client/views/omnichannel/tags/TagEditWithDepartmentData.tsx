import type { ILivechatTag, Serialized } from '@rocket.chat/core-typings';
import { ContextualbarSkeletonBody } from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import TagEdit from './TagEdit';
import NotAvailableCallout from '../components/NotAvailableCallout';

const TagEditWithDepartmentData = ({ tagData, onClose }: { tagData: Serialized<ILivechatTag>; onClose: () => void }) => {
	const getDepartmentsById = useEndpoint('GET', '/v1/livechat/department.listByIds');
	const { data, isPending, isError } = useQuery({
		queryKey: ['livechat-getDepartmentsById', tagData.departments],
		queryFn: async () => getDepartmentsById({ ids: tagData.departments }),
		refetchOnWindowFocus: false,
	});

	if (isPending) {
		return <ContextualbarSkeletonBody />;
	}

	if (isError) {
		return <NotAvailableCallout />;
	}

	return <TagEdit tagData={tagData} currentDepartments={data?.departments} onClose={onClose} />;
};

export default TagEditWithDepartmentData;
