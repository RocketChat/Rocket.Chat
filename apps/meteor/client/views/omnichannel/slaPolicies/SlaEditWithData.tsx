import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import SlaEdit from './SlaEdit';
import { FormSkeleton } from '../../../components/Skeleton';
import NotAvailableCallout from '../components/NotAvailableCallout';

type SlaEditProps = {
	slaId: string;
	reload: () => void;
};

function SlaEditWithData({ slaId, reload }: SlaEditProps) {
	const getSLA = useEndpoint('GET', `/v1/livechat/sla/:slaId`, { slaId });
	const { data, isPending, isError } = useQuery({
		queryKey: ['/v1/livechat/sla', slaId],
		queryFn: () => getSLA(),
	});

	if (isPending) {
		return <FormSkeleton />;
	}

	if (isError || !data) {
		return <NotAvailableCallout />;
	}

	return <SlaEdit slaId={slaId} data={data} reload={reload} />;
}

export default SlaEditWithData;
