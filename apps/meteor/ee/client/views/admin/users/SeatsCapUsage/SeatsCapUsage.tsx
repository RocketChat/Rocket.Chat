import { ProgressBar, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

type SeatsCapUsageProps = {
	limit: number;
	members: number;
};

const SeatsCapUsage = ({ limit, members }: SeatsCapUsageProps): ReactElement => {
	const t = useTranslation();
	const percentage = Math.max(0, Math.min((100 / limit) * members, 100));
	const closeToLimit = percentage >= 80;
	const reachedLimit = percentage >= 100;
	const color = closeToLimit ? 'danger-500' : 'success-500';
	const seatsLeft = Math.max(0, limit - members);

	return (
		<Box display='flex' flexDirection='column' minWidth='x180'>
			<Box
				color={reachedLimit ? color : 'default'}
				display='flex'
				flexDirection='row'
				justifyContent='space-between'
				fontScale='c1'
				mb='x8'
			>
				<div>{t('Seats_Available', { seatsLeft })}</div>
				<Box color={reachedLimit ? color : 'neutral-700'}>{`${members}/${limit}`}</Box>
			</Box>
			<ProgressBar borderRadius='x8' overflow='hidden' percentage={percentage} barColor={color} animated={false} w='full' />
		</Box>
	);
};

export default SeatsCapUsage;
