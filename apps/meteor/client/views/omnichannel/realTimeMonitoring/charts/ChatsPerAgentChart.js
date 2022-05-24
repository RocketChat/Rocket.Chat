import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef, useEffect } from 'react';

import { drawLineChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';

const initialData = {
	agents: {},
};

const init = (canvas, context, t) =>
	drawLineChart(canvas, context, [t('Open'), t('Closed'), t('On_Hold_Chats')], [], [[], []], {
		legends: true,
		anim: true,
		smallTicks: true,
	});

const ChatsPerAgentChart = ({ params, reloadRef, ...props }) => {
	const t = useTranslation();

	const canvas = useRef();
	const context = useRef();

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		t,
		init,
	});

	const { value: data, phase: state, reload } = useEndpointData('livechat/analytics/dashboards/charts/chats-per-agent', params);

	reloadRef.current.chatsPerAgentChart = reload;

	const chartData = data ?? initialData;

	useEffect(() => {
		const initChart = async () => {
			context.current = await init(canvas.current, context.current, t);
		};
		initChart();
	}, [t]);

	useEffect(() => {
		if (state === AsyncStatePhase.RESOLVED) {
			if (chartData && chartData.success) {
				delete chartData.success;
				Object.entries(chartData).forEach(([name, value]) => {
					updateChartData(name, [value.open, value.closed, value.onhold]);
				});
			}
		}
	}, [chartData, state, t, updateChartData]);

	return <Chart ref={canvas} {...props} />;
};

export default ChatsPerAgentChart;
