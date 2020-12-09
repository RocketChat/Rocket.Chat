import React, { useRef, useEffect } from 'react';

import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { drawLineChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';

const initialData = {
	agents: {},
};

const init = (canvas, context, t) => drawLineChart(
	canvas,
	context,
	[t('Open'), t('Closed')],
	[],
	[[], []],
	{ legends: true, anim: true, smallTicks: true },
);

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

	const { value: data, phase: state, reload } = useEndpointData(
		'livechat/analytics/dashboards/charts/chats-per-agent',
		params,
	);

	reloadRef.current.chatsPerAgentChart = reload;

	const {
		agents = {},
	} = data ?? initialData;

	useEffect(() => {
		const initChart = async () => {
			context.current = await init(canvas.current, context.current, t);
		};
		initChart();
	}, [t]);

	useEffect(() => {
		if (state === AsyncStatePhase.RESOLVED) {
			Object.entries(agents).forEach(([name, value]) => {
				updateChartData(name, [value.open, value.closed]);
			});
		}
	}, [agents, state, t, updateChartData]);

	return <Chart ref={canvas} {...props}/>;
};

export default ChatsPerAgentChart;
