import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef, useEffect } from 'react';

import { drawLineChart } from '../../../../app/livechat/client/lib/chartHandler';
import { secondsToHHMMSS } from '../../../../lib/utils/secondsToHHMMSS';
import Chart from '../realTimeMonitoring/charts/Chart';

const getChartTooltips = (chartName) => {
	switch (chartName) {
		case 'Avg_chat_duration':
		case 'Avg_first_response_time':
		case 'Best_first_response_time':
		case 'Avg_response_time':
		case 'Avg_reaction_time':
			return {
				callbacks: {
					title([ctx]) {
						const { dataset } = ctx;
						return dataset.label;
					},
					label(ctx) {
						const { dataset, dataIndex } = ctx;
						return secondsToHHMMSS(dataset.data[dataIndex]);
					},
				},
			};
		default:
			return {};
	}
};

const InterchangeableChart = ({ departmentId, dateRange, chartName, ...props }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const canvas = useRef();
	const context = useRef();

	const { start, end } = dateRange;

	const loadData = useMethod('livechat:getAnalyticsChartData');

	const draw = useMutableCallback(async (params) => {
		try {
			const tooltipCallbacks = getChartTooltips(chartName);
			if (!params?.daterange?.from || !params?.daterange?.to) {
				return;
			}
			const result = await loadData(params);
			if (!result?.chartLabel || !result?.dataLabels || !result?.dataPoints) {
				throw new Error('Error! fetching chart data. Details: livechat:getAnalyticsChartData => Missing Data');
			}
			context.current = await drawLineChart(canvas.current, context.current, [result.chartLabel], result.dataLabels, [result.dataPoints], {
				tooltipCallbacks,
			});
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
