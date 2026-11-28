import type { DatumId } from '@nivo/pie';
import { Pie } from '@nivo/pie';
import { Palette, Stack, Text } from '@rocket.chat/fuselage';
import type { CSSProperties, ReactNode } from 'react';
import { useMemo, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useLocalePercentage } from '../hooks/useLocalePercentage';
import UsagePieChartFrame from '../layout/UsagePieChartFrame';

type GraphColorsReturn = { [key: string]: string };

const graphColors = (color: CSSProperties['color']): GraphColorsReturn => ({
	used: color || Palette.statusColor['status-font-on-success'].toString(),
	free: Palette.stroke['stroke-extra-light'].toString(),
});

export type UsagePieGraphProps = {
	used: number;
	total: number;
	label?: ReactNode;
	color?: string;
	size?: number;
};

type GraphData = Array<{
	id: string;
	label: string;
	value: number;
}>;

const UsagePieGraph = ({ used = 0, total = 0, label, color, size = 140 }: UsagePieGraphProps) => {
	const { t } = useTranslation();
	const parsedData = useMemo(
		(): GraphData => [
			{
				id: 'used',
				label: 'used',
				value: used,
			},
			{
				id: 'free',
				label: 'free',
				value: total - used,
			},
		],
		[total, used],
	);

	const getColor = useCallback(
		(datum: { id: DatumId } | undefined) => {
			if (!datum || typeof datum.id !== 'string') {
				return '';
			}
			return graphColors(color)[datum.id];
		},
		[color],
	);

	const unlimited = total === 0;

	const localePercentage = useLocalePercentage(total, used, 0);

	return (
		<Stack align='center'>
			<UsagePieChartFrame size={size} center={<Text fontScale='p2m'>{unlimited ? '∞' : localePercentage}</Text>}>
				<Pie
					data={parsedData}
					margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
					innerRadius={0.8}
					colors={getColor}
					width={size}
					height={size}
					enableArcLabels={false}
					enableArcLinkLabels={false}
				/>
			</UsagePieChartFrame>
			<Stack align='center' gap='x4'>
				<Text is='span' fontScale='p2' color='secondary-info'>
					{unlimited &&
						t('used_limit_infinite', {
							used,
						})}
					{!unlimited &&
						t('used_limit', {
							used,
							limit: total,
						})}
				</Text>
				{label && (
					<Text is='span' color='secondary-info'>
						{label}
					</Text>
				)}
			</Stack>
		</Stack>
	);
};

export default memo(UsagePieGraph);
