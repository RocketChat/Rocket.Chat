import { Callout } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { PriorityEditFormProps } from './PriorityEditForm';
import PriorityEditForm from './PriorityEditForm';
import { FormSkeleton } from '../../components/Skeleton';
import { usePriorityInfo } from '../../views/omnichannel/directory/hooks/usePriorityInfo';

type PriorityEditFormWithDataProps = Omit<PriorityEditFormProps, 'data'> & {
	priorityId: string;
};

function PriorityEditFormWithData({ priorityId, ...props }: PriorityEditFormWithDataProps): ReactElement {
	const { t } = useTranslation();
	const { data, isLoading, isError } = usePriorityInfo(priorityId);

	if (isLoading) {
		return <FormSkeleton />;
	}

	if (isError || !data) {
		return (
			<Callout m={16} type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return <PriorityEditForm {...props} data={data} />;
}

export default PriorityEditFormWithData;
