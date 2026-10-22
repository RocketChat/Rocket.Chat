import type { ILivechatTag, Serialized } from '@rocket.chat/core-typings';
import { Box, Callout } from '@rocket.chat/fuselage';
import { ContextualbarSkeletonBody } from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import TagEdit from './TagEdit';

const TagEditWithDepartmentData = ({ tagData, onClose }: { tagData: Serialized<ILivechatTag>; onClose: () => void }) => {
	const t = useTranslation();

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
		return (
			<Box margin={16}>
				<Callout type='danger'>{t('Not_Available')}</Callout>
			</Box>
		);
	}

	return <TagEdit tagData={tagData} currentDepartments={data?.departments} onClose={onClose} />;
};

export default TagEditWithDepartmentData;
