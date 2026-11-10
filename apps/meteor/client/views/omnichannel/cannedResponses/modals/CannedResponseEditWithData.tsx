import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import CannedResponseEdit from './CannedResponseEdit';
import CannedResponseEditWithDepartmentData from './CannedResponseEditWithDepartmentData';
import { useRemoveCannedResponse } from './useRemoveCannedResponse';
import { FormSkeleton } from '../../../../components/Skeleton';
import NotAvailableCallout from '../../components/NotAvailableCallout';

export type CannedResponseEditWithDataProps = { cannedResponseId: IOmnichannelCannedResponse['_id'] };

const CannedResponseEditWithData = ({ cannedResponseId }: CannedResponseEditWithDataProps) => {
	const getCannedResponseById = useEndpoint('GET', '/v1/canned-responses/:_id', { _id: cannedResponseId });
	const handleDelete = useRemoveCannedResponse(cannedResponseId);

	const { data, isPending, isError } = useQuery({
		queryKey: ['getCannedResponseById', cannedResponseId],
		queryFn: async () => getCannedResponseById(),
	});

	if (isPending) {
		return <FormSkeleton />;
	}

	if (isError) {
		return <NotAvailableCallout />;
	}

	if (data?.cannedResponse?.scope === 'department') {
		return <CannedResponseEditWithDepartmentData cannedResponseData={data.cannedResponse} onDelete={handleDelete} />;
	}

	return <CannedResponseEdit cannedResponseData={data?.cannedResponse} onDelete={handleDelete} />;
};

export default CannedResponseEditWithData;
