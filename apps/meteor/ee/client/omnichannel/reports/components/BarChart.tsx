import { ResponsiveBar } from '@nivo/bar';
import { Box, Tooltip } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { REPORTS_CHARTS_THEME } from './constants';

export const BarChart = ({ data, height, direction = 'vertical' }) => {
	const t = useTranslation();

	const minHeight = useMemo(() => data.length * 22, [data.length]);

	return (
		<Box height={height} overflowY='auto'>
			<Box position='relative' height={minHeight > height ? minHeight : null}>
				<ResponsiveBar
					animate
					data={data}
					indexBy='label'
					layout={direction}
					keys={['value']}
					groupMode='grouped'
					padding={0.25}
					colors={data.map((d) => d.color)}
					// enableLabel={false}
					enableGridY={false}
					axisTop={null}
					axisRight={null}
					axisBottom={null}
					axisLeft={{
						tickSize: 5,
						tickPadding: 5,
						tickRotation: 0,
						legend: 'food',
						legendPosition: 'middle',
						legendOffset: -40,
					}}
					margin={{ top: 0, right: 0, bottom: 0, left: 90 }}
					motionConfig='stiff'
					theme={REPORTS_CHARTS_THEME}
					tooltip={({ value }) => <Tooltip>{t('Value_users', { value })}</Tooltip>}
				/>
			</Box>
		</Box>
	);
};
