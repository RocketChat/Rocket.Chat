import { FormSkeleton } from '@rocket.chat/ui-client';

import type { PriorityEditFormProps } from './PriorityEditForm';
import PriorityEditForm from './PriorityEditForm';
import NotAvailableCallout from '../components/NotAvailableCallout';
import { usePriorityInfo } from '../directory/hooks/usePriorityInfo';

export type PriorityEditFormWithDataProps = Omit<PriorityEditFormProps, 'data'> & {
	priorityId: string;
};

function PriorityEditFormWithData({ priorityId, ...props }: PriorityEditFormWithDataProps) {
	const { data, isLoading, isError } = usePriorityInfo(priorityId);

	if (isLoading) {
		return <FormSkeleton />;
	}

	if (isError || !data) {
		return <NotAvailableCallout />;
	}

	return <PriorityEditForm {...props} data={data} />;
}

export default PriorityEditFormWithData;
