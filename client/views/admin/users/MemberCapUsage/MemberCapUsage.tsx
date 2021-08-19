import { ProgressBar, Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';

type MemberCapUsageProps = {
	limit: number;
	members: number;
};

const useLabel = (percentage: number): string => {
	const fixedPercentage = percentage.toFixed(0);
	const t = useTranslation();

	if (percentage >= 100) {
		return t('Out_of_seats');
	}

	return `${fixedPercentage}% ${t('Usage')}`;
};

const MemberCapUsage = ({ limit, members }: MemberCapUsageProps): ReactElement => {
	const percentage = Math.max(0, Math.min((100 / limit) * members, 100));
	const closeToLimit = percentage >= 80;
	const reachedLimit = percentage >= 100;
	const color = closeToLimit ? 'danger-500' : 'success-500';
	const label = useLabel(percentage);
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
				<div>{label}</div>
				<Box color={reachedLimit ? color : 'neutral-700'}>{`${members}/${limit}`}</Box>
			</Box>
			<ProgressBar
				borderRadius='x8'
				overflow='hidden'
				percentage={percentage}
				barColor={color}
				w='full'
			/>
		</Box>
	);
};

export default MemberCapUsage;
