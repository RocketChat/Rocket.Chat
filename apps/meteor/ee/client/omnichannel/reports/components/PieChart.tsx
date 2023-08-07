import { Pie, ResponsivePie } from '@nivo/pie';
import { Badge, Box, Tooltip } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { Legend } from './Legend';
import { REPORTS_CHARTS_THEME } from './constants';

export const PieChart = ({ data, width, height }) => {
	const t = useTranslation();
	return (
		<Box position='relative' height={height} maxWidth={400} display='flex' alignItems='center' style={{ columnGap: 24 }}>
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
				tooltip={({ datum }) => <Tooltip>{t('Value_messages', { value: datum.value })}</Tooltip>}
			/>
			<Legend data={data} />
		</Box>
	);
};
