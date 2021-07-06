import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useRef, useEffect } from 'react';

import { drawLineChart } from '../../../../app/livechat/client/lib/chartHandler';
import { useMethod } from '../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import Chart from '../realTimeMonitoring/charts/Chart';

const InterchangeableChart = ({ departmentId, dateRange, chartName, ...props }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const canvas = useRef();
	const context = useRef();

	const { start, end } = dateRange;

	const loadData = useMethod('livechat:getAnalyticsChartData');

	const draw = useMutableCallback(async (params) => {
		try {
			if (!params?.daterange?.from || !params?.daterange?.to) {
				return;
			}
			const result = await loadData(params);
			if (!result?.chartLabel || !result?.dataLabels || !result?.dataPoints) {
				throw new Error(
					'Error! fetching chart data. Details: livechat:getAnalyticsChartData => Missing Data',
				);
			}
			context.current = await drawLineChart(
				canvas.current,
				context.current,
				[result.chartLabel],
				result.dataLabels,
				[result.dataPoints],
			);
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
			...(departmentId && { departmentId }),
		});
	}, [chartName, departmentId, draw, end, start, t, loadData]);

	return <Chart border='none' pi='none' ref={canvas} {...props} />;
};

export default InterchangeableChart;
