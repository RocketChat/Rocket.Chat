import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import TagEdit from './TagEdit';
import TagEditWithDepartmentData from './TagEditWithDepartmentData';

function TagEditWithData({ tagId, reload, title }) {
	const getTag = useEndpoint('GET', '/v1/livechat/tags/:tagId', { tagId });
	const { data, isLoading, isError } = useQuery(['/v1/livechat/tags/:tagId', tagId], () => getTag(), { enabled: Boolean(tagId) });
	const t = useTranslation();

	if (isLoading && tagId) {
		return <FormSkeleton />;
	}

	if (isError) {
		return (
			<Callout m={16} type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return (
		<>
			{data && data.departments && data.departments.length > 0 ? (
				<TagEditWithDepartmentData tagId={tagId} data={data} reload={reload} title={title} />
			) : (
				<TagEdit tagId={tagId} data={data} reload={reload} title={title} />
			)}
		</>
	);
}

export default TagEditWithData;
