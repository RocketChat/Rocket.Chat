import { Callout } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import SlaEdit from './SlaEdit';
import { FormSkeleton } from '../../components/Skeleton';

type SlaEditProps = {
	slaId: string;
	reload: () => void;
};

function SlaEditWithData({ slaId, reload }: SlaEditProps): ReactElement {
	const getSLA = useEndpoint('GET', `/v1/livechat/sla/:slaId`, { slaId });
	const { data, isPending, isError } = useQuery({
		queryKey: ['/v1/livechat/sla', slaId],
		queryFn: () => getSLA(),
	});
	const { t } = useTranslation();

	if (isPending) {
		return <FormSkeleton />;
	}

	if (isError || !data) {
		return (
			<Callout m={16} type='danger'>
				{t('Not_Available')}
			</Callout>
		);
	}

	return <SlaEdit slaId={slaId} data={data} reload={reload} />;
}

export default SlaEditWithData;
