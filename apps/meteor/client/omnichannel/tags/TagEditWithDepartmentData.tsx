import type { ILivechatTag } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import TagEdit from './TagEdit';
import { ContextualbarSkeleton } from '../../components/Contextualbar';

const TagEditWithDepartmentData = ({ tagData }: { tagData: ILivechatTag }) => {
	const t = useTranslation();

	const getDepartmentsById = useEndpoint('GET', '/v1/livechat/department.listByIds');
	const { data, isPending, isError } = useQuery({
		queryKey: ['livechat-getDepartmentsById', tagData.departments],
		queryFn: async () => getDepartmentsById({ ids: tagData.departments }),
		refetchOnWindowFocus: false,
	});

	if (isPending) {
		return <ContextualbarSkeleton />;
	}

	if (isError) {
		return (
			<Callout m={16} type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return <TagEdit tagData={tagData} currentDepartments={data?.departments} />;
};

export default TagEditWithDepartmentData;
