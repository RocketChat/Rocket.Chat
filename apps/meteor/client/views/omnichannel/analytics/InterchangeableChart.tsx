import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useMethod } from '@rocket.chat/ui-contexts';
import type * as chartjs from 'chart.js';
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { drawLineChart } from '../../../../app/livechat/client/lib/chartHandler';
import { secondsToHHMMSS } from '../../../../lib/utils/secondsToHHMMSS';
import Chart from '../realTimeMonitoring/charts/Chart';

const getChartTooltips = (chartName: string) => {
	switch (chartName) {
		case 'Avg_chat_duration':
		case 'Avg_first_response_time':
		case 'Best_first_response_time':
		case 'Avg_response_time':
		case 'Avg_reaction_time':
			return {
				callbacks: {
					title([ctx]: [chartjs.TooltipItem<'line'>]) {
						const { dataset } = ctx;
						return dataset.label;
					},
					label(ctx: chartjs.TooltipItem<'line'>) {
						const { dataset, dataIndex } = ctx;
						const item = dataset.data[dataIndex];
						return secondsToHHMMSS(typeof item === 'number' ? item : 0);
					},
				},
			};
		default:
			return {};
	}
};

const InterchangeableChart = ({
	departmentId,
	dateRange,
	chartName,
	...props
}: {
	departmentId: string;
	dateRange: { start: string; end: string };
	chartName: string;
	flexShrink: number;
	h: string;
	w: string;
	alignSelf: string;
}) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const canvas = useRef<HTMLCanvasElement | null>(null);
	const context = useRef<chartjs.Chart<'line', number[], string>>();

	const { start, end } = dateRange;

	const loadData = useMethod('livechat:getAnalyticsChartData');

	const draw = useEffectEvent(
		async (params: {
			daterange: {
				from: string;
				to: string;
			};
			chartOptions: {
				name: string;
			};
		}) => {
			try {
				const tooltipCallbacks = getChartTooltips(chartName);
				if (!params?.daterange?.from || !params?.daterange?.to) {
					return;
				}
				const result = await loadData(params);
				if (!result?.chartLabel || !result?.dataLabels || !result?.dataPoints) {
					throw new Error('Error! fetching chart data. Details: livechat:getAnalyticsChartData => Missing Data');
				}
				(context.current || typeof context.current === 'undefined') &&
					canvas.current &&
					(context.current = await drawLineChart(
						canvas.current,
						context.current,
						[result.chartLabel],
						result.dataLabels,
						[result.dataPoints],
						{
							tooltipCallbacks,
						},
					));
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
	);

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

	return <Chart canvasRef={canvas} {...props} />;
};

export default InterchangeableChart;
