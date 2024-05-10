import type { ILivechatTag } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { ContextualbarSkeleton } from '../../../../client/components/Contextualbar';
import TagEdit from './TagEdit';

const TagEditWithDepartmentData = ({ tagData }: { tagData: ILivechatTag }) => {
	const t = useTranslation();

	const getDepartmentsById = useEndpoint('GET', '/v1/livechat/department.listByIds');
	const { data, isLoading, isError } = useQuery(
		['livechat-getDepartmentsById', tagData.departments],
		async () => getDepartmentsById({ ids: tagData.departments }),
		{ refetchOnWindowFocus: false },
	);

	if (isLoading) {
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
