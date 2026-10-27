import type { PriorityEditFormProps } from './PriorityEditForm';
import PriorityEditForm from './PriorityEditForm';
import { FormSkeleton } from '../../../components/Skeleton';
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
