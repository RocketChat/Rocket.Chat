import { Box, ProgressBar } from '@rocket.chat/fuselage';
import { useId } from 'react';
import type { ReactNode } from 'react';

const GenericResourceUsage = ({
	title,
	value,
	max,
	percentage,
	threshold = 80,
	variant = percentage < threshold ? 'success' : 'danger',
	subTitle,
	tooltip,
	...props
}: {
	title: string;
	subTitle?: ReactNode;
	value: number;
	max: number;
	percentage: number;
	threshold?: number;
	variant?: 'warning' | 'danger' | 'success';
	tooltip?: string;
}) => {
	const labelId = useId();

	return (
		<Box
			title={tooltip}
			w='x180'
			h='x40'
			mi={8}
			fontScale='c1'
			display='flex'
			flexDirection='column'
			justifyContent='space-around'
			{...props}
		>
			<Box display='flex' justifyContent='space-between'>
				<Box color='default' id={labelId}>
					{title}
				</Box>
				{subTitle && <Box color='hint'>{subTitle}</Box>}
				<Box color='hint'>
					{value}/{max}
				</Box>
			</Box>
			<ProgressBar
				percentage={percentage}
				variant={variant}
				role='progressbar'
				aria-labelledby={labelId}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percentage}
			/>
		</Box>
	);
};

export default GenericResourceUsage;
