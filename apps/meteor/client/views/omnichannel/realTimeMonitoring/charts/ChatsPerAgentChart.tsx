import type { Box } from '@rocket.chat/fuselage';
import type { OperationParams } from '@rocket.chat/rest-typings';
import type { TranslationContextValue } from '@rocket.chat/ui-contexts';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { Chart as ChartType } from 'chart.js';
import type { ComponentProps, MutableRefObject } from 'react';
import React, { useRef, useEffect, useState, useMemo } from 'react';

import { drawLineChart } from '../../../../../app/livechat/client/lib/chartHandler';
import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';

const initialData = {
	agents: {},
	success: true,
};

const init = (canvas: HTMLCanvasElement, context: ChartType | undefined, t: TranslationContextValue['translate']) =>
	drawLineChart(canvas, context, [t('Open'), t('Closed'), t('On_Hold_Chats')], [], [[], []], {
		legends: true,
		anim: true,
		smallTicks: true,
	});

type ChatsPerAgentChartProps = {
	params: OperationParams<'GET', '/v1/livechat/analytics/dashboards/charts/chats-per-agent'>;
	reloadFrequency: number;
} & ComponentProps<typeof Box>;

const ChatsPerAgentChart = ({ params, reloadFrequency, ...props }: ChatsPerAgentChartProps) => {
	const t = useTranslation();

	const canvas: MutableRefObject<HTMLCanvasElement | null> = useRef(null);
	const context: MutableRefObject<ChartType | undefined> = useRef();

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		t,
		init,
	});

	const [isInitialized, setIsInitialized] = useState(false);

	const memoizedParams = useMemo(() => params, [params]);

	const getChartData = useEndpoint('GET', '/v1/livechat/analytics/dashboards/charts/chats-per-agent');

	const { data, isLoading } = useQuery(['ChatsPerAgentChart', memoizedParams], async () => getChartData(memoizedParams), {
		refetchInterval: reloadFrequency * 1000,
	});

	const chartData = data ?? initialData;

	useEffect(() => {
		const initChart = async () => {
			if (canvas?.current) {
				context.current = await init(canvas.current, context.current, t);
				setIsInitialized(true);
			}
		};
		initChart();
	}, [t]);

	useEffect(() => {
		if (!isLoading && isInitialized) {
			if (chartData?.success) {
				const { success, ...filteredChartData } = chartData;
				Object.entries(filteredChartData).forEach(([name, value]) => {
					const { open, closed, onhold } = value as {
						open: number;
						closed: number;
						onhold: number;
					};

					updateChartData(name, [open, closed, onhold]);
				});
			}
		}
	}, [chartData, isInitialized, isLoading, t, updateChartData]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default ChatsPerAgentChart;
