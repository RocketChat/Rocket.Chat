import type { DatumId } from '@nivo/pie';
import { Pie } from '@nivo/pie';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ReactElement, CSSProperties, ReactNode } from 'react';
import React, { useMemo, useCallback } from 'react';

import { useLocalePercentage } from '../../../hooks/useLocalePercentage';

type GraphColorsReturn = { [key: string]: string };

const graphColors = (color: CSSProperties['color']): GraphColorsReturn => ({
	used: color || Palette.stroke['stroke-highlight'].toString(),
	free: Palette.stroke['stroke-extra-light'].toString(),
});

type UsageGraphProps = {
	used: number;
	total: number;
	label: ReactNode;
	color?: string;
	size: number;
};

type GraphData = Array<{
	id: string;
	label: string;
	value: number;
}>;

const UsageGraph = ({ used = 0, total = 0, label, color, size }: UsageGraphProps): ReactElement => {
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
		<Box display='flex' flexDirection='column' alignItems='center'>
			<Box size={`x${size}`}>
				<Box position='relative'>
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
					<Box
						display='flex'
						alignItems='center'
						justifyContent='center'
						position='absolute'
						color={color}
						fontScale='p2m'
						style={{ left: 0, right: 0, top: 0, bottom: 0 }}
					>
						{unlimited ? '∞' : localePercentage}
					</Box>
				</Box>
			</Box>
			<span>
				<Box is='span' color='default'>
					{used}
				</Box>{' '}
				/ {unlimited ? '∞' : total}
			</span>
			<Box is='span' mbs={4}>
				{label}
			</Box>
		</Box>
	);
};

export default UsageGraph;
