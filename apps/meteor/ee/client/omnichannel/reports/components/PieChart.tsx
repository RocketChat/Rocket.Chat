import { Pie } from '@nivo/pie';
import { Tooltip } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { REPORTS_CHARTS_THEME } from './constants';

export const PieChart = ({ data, width, height }: { data: unknown; width: number; height: number }) => {
	const t = useTranslation();
	return (
		<Pie
			// animate
			width={width}
			height={height}
			data={data}
			innerRadius={0.6}
			colors={data.map((d) => d.color)}
			motionConfig='stiff'
			theme={REPORTS_CHARTS_THEME}
			enableArcLinkLabels={false}
			enableArcLabels={false}
			margin={{ right: 100 }}
			tooltip={({ datum }) => <Tooltip>{t('Value_messages', { value: datum.value })}</Tooltip>}
			legends={[
				{
					anchor: 'right',
					direction: 'column',
					justify: false,
					translateX: 100,
					translateY: 0,
					itemWidth: 84,
					itemHeight: 20,
					itemsSpacing: 8,
					symbolSize: 20,
					itemDirection: 'left-to-right',
				},
			]}
		/>
	);
};
