import type { ILivechatTag } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useMemo, ReactNode } from 'react';

import { FormSkeleton } from '../../../../client/components/Skeleton';
import { AsyncStatePhase } from '../../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../../client/hooks/useEndpointData';
import TagEdit from './TagEdit';

type TagEditWithDepartmentDataPropsType = {
	data: ILivechatTag;
	title: ReactNode;
	tagId: ILivechatTag['_id'];
	reload: () => void;
};

function TagEditWithDepartmentData({ data, title, ...props }: TagEditWithDepartmentDataPropsType): ReactElement {
	const t = useTranslation();

	const {
		value: currentDepartments,
		phase: currentDepartmentsState,
		error: currentDepartmentsError,
	} = useEndpointData(
		'livechat/department.listByIds',
		useMemo(() => ({ ids: data?.departments ? data.departments : [] }), [data]),
	);

	if ([currentDepartmentsState].includes(AsyncStatePhase.LOADING)) {
		return <FormSkeleton />;
	}

	if (currentDepartmentsError) {
		return (
			<Callout m='x16' type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return <TagEdit title={title} currentDepartments={currentDepartments} data={data} {...props} />;
}

export default TagEditWithDepartmentData;
