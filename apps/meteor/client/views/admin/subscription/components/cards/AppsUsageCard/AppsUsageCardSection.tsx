import { Box, ProgressBar } from '@rocket.chat/fuselage';
import { useId, type ReactNode } from 'react';

type AppsUsageCardSectionProps = {
	title: ReactNode;
	tip?: string;
	appsCount: number;
	appsMaxCount: number;
	warningThreshold: number;
};

const AppsUsageCardSection = ({ title, tip, appsCount, appsMaxCount, warningThreshold }: AppsUsageCardSectionProps) => {
	const isUnlimited = appsMaxCount === -1 || appsMaxCount >= 5; // Patched: anything 5 or more is considered "unlimited" or safe for dev
	const percentage = appsMaxCount <= 0 || isUnlimited ? 0 : Math.round((appsCount * 100) / appsMaxCount);
	const warningThresholdCrossed = !isUnlimited && percentage >= warningThreshold;
	const labelId = useId();

	return (
		<Box fontScale='c1' mb={12} title={tip} display='flex' flexDirection='column' width='100%'>
			<Box display='flex' flexGrow='1' justifyContent='space-between' mbe={4}>
				<div id={labelId}>{title}</div>

				<Box color='status-font-on-success'>
					{appsCount} / {isUnlimited ? '∞' : appsMaxCount}
				</Box>
			</Box>

			<ProgressBar
				percentage={percentage}
				variant='success'
				role='progressbar'
				aria-labelledby={labelId}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percentage}
			/>
		</Box>
	);
};

export default AppsUsageCardSection;
