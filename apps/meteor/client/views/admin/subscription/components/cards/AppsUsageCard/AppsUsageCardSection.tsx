import { ProgressBar, Text } from '@rocket.chat/fuselage';
import { useId, type ReactNode } from 'react';

import AppsUsageMeter from '../../../layout/AppsUsageMeter';

export type AppsUsageCardSectionProps = {
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
		<AppsUsageMeter
			title={tip}
			label={
				<Text id={labelId} fontScale='c1'>
					{title}
				</Text>
			}
			count={
				<Text fontScale='c1' color={warningThresholdCrossed ? 'status-font-on-danger' : 'status-font-on-success'}>
					{appsCount} / {appsMaxCount}
				</Text>
			}
		>
			<ProgressBar
				percentage={percentage}
				variant={warningThresholdCrossed ? 'danger' : 'success'}
				role='progressbar'
				aria-labelledby={labelId}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percentage}
			/>
		</AppsUsageMeter>
	);
};

export default AppsUsageCardSection;
