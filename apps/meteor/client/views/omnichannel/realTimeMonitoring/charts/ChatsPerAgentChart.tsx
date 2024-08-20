import type { OperationParams } from '@rocket.chat/rest-typings';
import type { TranslationContextValue } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { Chart as ChartType } from 'chart.js';
import type { MutableRefObject } from 'react';
import React, { useRef, useEffect } from 'react';

import { drawLineChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
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
	params: OperationParams<'GET', '/v1/livechat/analytics/dashboards/charts/timings'>;
	reloadRef: MutableRefObject<{ [x: string]: () => void }>;
};

const ChatsPerAgentChart = ({ params, reloadRef, ...props }: ChatsPerAgentChartProps) => {
	const t = useTranslation();

	const canvas: MutableRefObject<HTMLCanvasElement | null> = useRef(null);
	const context: MutableRefObject<ChartType | undefined> = useRef();

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		t,
		init,
	});

	const { value: data, phase: state, reload } = useEndpointData('/v1/livechat/analytics/dashboards/charts/chats-per-agent', { params });

	reloadRef.current.chatsPerAgentChart = reload;

	const chartData = data ?? initialData;

	useEffect(() => {
		const initChart = async () => {
			if (canvas?.current) {
				context.current = await init(canvas.current, context.current, t);
			}
		};
		initChart();
	}, [t]);

	useEffect(() => {
		if (state === AsyncStatePhase.RESOLVED) {
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
	}, [chartData, state, t, updateChartData]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default ChatsPerAgentChart;
