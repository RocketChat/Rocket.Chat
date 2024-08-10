import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { GenericResourceUsage } from '../../../../components/GenericResourceUsage';

type SeatsCapUsageProps = {
	limit: number;
	members: number;
};

const SeatsCapUsage = ({ limit, members }: SeatsCapUsageProps): ReactElement => {
	const t = useTranslation();
	const percentage = Math.max(0, Math.min((100 / limit) * members, 100));
	const seatsLeft = Math.max(0, limit - members);

	return <GenericResourceUsage title={t('Seats_Available', { seatsLeft })} value={members} max={limit} percentage={percentage} />;
};

export default SeatsCapUsage;
