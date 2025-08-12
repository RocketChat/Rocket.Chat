import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericResourceUsage } from '../../../../components/GenericResourceUsage';

type SeatsCapUsageProps = {
	limit: number;
	members: number;
};

const SeatsCapUsage = ({ limit, members }: SeatsCapUsageProps): ReactElement => {
	const { t } = useTranslation();
	const percentage = Math.max(0, Math.min((100 / limit) * members, 100));
	const seatsLeft = Math.max(0, limit - members);

	return (
		<GenericResourceUsage
			title={t('Seats_Available', { seatsLeft })}
			value={members}
			max={limit}
			percentage={percentage}
			data-testid='seats-cap-progress-bar'
		/>
	);
};

export default SeatsCapUsage;
