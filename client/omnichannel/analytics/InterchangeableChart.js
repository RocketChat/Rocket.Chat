import React, { useRef, useEffect } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Chart from '../realTimeMonitoring/charts/Chart';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { drawLineChart } from '../../../app/livechat/client/lib/chartHandler';


const InterchangeableChart = ({ departmentId, dateRange, chartName, ...props }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const canvas = useRef();
	const context = useRef();

	const {
		start,
		end,
	} = dateRange;

	const loadData = useMethod('livechat:getAnalyticsChartData');

	const draw = useMutableCallback(async (params) => {
		try {
			const result = await loadData(params);
			if (!(result && result.chartLabel && result.dataLabels && result.dataPoints)) {
				return console.log('livechat:getAnalyticsChartData => Missing Data');
			}
			context.current = await drawLineChart(canvas.current, context.current, [result.chartLabel], result.dataLabels, [result.dataPoints]);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	useEffect(() => {
		draw({
			daterange: {
				from: start,
				to: end,
			},
			chartOptions: { name: chartName },
			...departmentId && { departmentId },
		});
	}, [chartName, departmentId, draw, end, start, t]);

	return <Chart border='none' pi='none' ref={canvas} {...props}/>;
};

export default InterchangeableChart;
