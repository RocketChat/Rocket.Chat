import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { FormSkeleton } from '../../components/Skeleton';
import CannedResponseEdit from './CannedResponseEdit';
import CannedResponseEditWithDepartmentData from './CannedResponseEditWithDepartmentData';

const CannedResponseEditWithData = ({ cannedResponseId }: { cannedResponseId: IOmnichannelCannedResponse['_id'] }) => {
	const t = useTranslation();

	const getCannedResponseById = useEndpoint('GET', '/v1/canned-responses/:_id', { _id: cannedResponseId });
	const { data, isLoading, isError } = useQuery(['getCannedResponseById', cannedResponseId], async () => getCannedResponseById());

	if (isLoading) {
		return <FormSkeleton />;
	}

	if (isError) {
		return (
			<Callout m={16} type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	if (data?.cannedResponse?.scope === 'department') {
		return <CannedResponseEditWithDepartmentData cannedResponseData={data.cannedResponse} />;
	}

	return <CannedResponseEdit cannedResponseData={data.cannedResponse} />;
};

export default CannedResponseEditWithData;
