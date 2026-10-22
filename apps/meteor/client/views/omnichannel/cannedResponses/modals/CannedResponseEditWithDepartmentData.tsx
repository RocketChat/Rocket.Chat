import type { IOmnichannelCannedResponse, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import CannedResponseEdit from './CannedResponseEdit';
import { FormSkeleton } from '../../../../components/Skeleton';
import { omnichannelQueryKeys } from '../../../../lib/queryKeys';
import NotAvailableCallout from '../../components/NotAvailableCallout';

const CannedResponseEditWithDepartmentData = ({
	cannedResponseData,
	onDelete,
}: {
	cannedResponseData: Serialized<IOmnichannelCannedResponse>;
	onDelete: () => void;
}) => {
	const departmentId = useMemo(() => cannedResponseData?.departmentId, [cannedResponseData]) as string;

	const getDepartment = useEndpoint('GET', '/v1/livechat/department/:_id', { _id: departmentId });
	const {
		data: departmentData,
		isPending,
		isError,
	} = useQuery({
		queryKey: omnichannelQueryKeys.department(departmentId),
		queryFn: async () => {
			const { department } = await getDepartment({});
			return department;
		},
	});

	if (isPending) {
		return <FormSkeleton />;
	}

	if (isError) {
		return <NotAvailableCallout />;
	}

	return <CannedResponseEdit cannedResponseData={cannedResponseData} departmentData={departmentData.department} onDelete={onDelete} />;
};

export default CannedResponseEditWithDepartmentData;
