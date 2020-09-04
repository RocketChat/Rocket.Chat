import React, { useRef, useEffect } from 'react';

import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../hooks/useEndpointDataExperimental';
import { useTranslation } from '../../../contexts/TranslationContext';
import { drawLineChart } from '../../../../app/livechat/client/lib/chartHandler';

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

	const { data, state, reload } = useEndpointDataExperimental(
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
		if (state === ENDPOINT_STATES.DONE) {
			Object.entries(agents).forEach(([name, value]) => {
				updateChartData(name, [value.open, value.closed]);
			});
		}
	}, [agents, state, t, updateChartData]);

	return <Chart ref={canvas} {...props}/>;
};

export default ChatsPerAgentChart;
