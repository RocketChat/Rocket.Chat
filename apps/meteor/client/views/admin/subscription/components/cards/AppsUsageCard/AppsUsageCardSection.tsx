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
	const percentage = appsMaxCount === 0 ? 100 : Math.round((appsCount * 100) / appsMaxCount);
	const warningThresholdCrossed = percentage >= warningThreshold;
	const labelId = useId();

	return (
		<Box fontScale='c1' mb={12} title={tip} display='flex' flexDirection='column' width='100%'>
			<Box display='flex' flexGrow='1' justifyContent='space-between' mbe={4}>
				<div id={labelId}>{title}</div>

				<Box color={warningThresholdCrossed ? 'status-font-on-danger' : 'status-font-on-success'}>
					{appsCount} / {appsMaxCount}
				</Box>
			</Box>

			<ProgressBar
				percentage={percentage}
				variant={warningThresholdCrossed ? 'danger' : 'success'}
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
