import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef, useEffect } from 'react';

import { drawDoughnutChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';

const labels = ['Available', 'Away', 'Busy', 'Offline'];

const initialData = {
	available: 0,
	away: 0,
	busy: 0,
	offline: 0,
};

const init = (canvas, context, t) =>
	drawDoughnutChart(
		canvas,
		t('Agents'),
		context,
		labels.map((l) => t(l)),
		Object.values(initialData),
	);

const AgentStatusChart = ({ params, reloadRef, ...props }) => {
	const t = useTranslation();

	const canvas = useRef();
	const context = useRef();

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		t,
		init,
	});

	const { value: data, phase: state, reload } = useEndpointData('livechat/analytics/dashboards/charts/agents-status', params);

	reloadRef.current.agentStatusChart = reload;

	const { offline = 0, available = 0, away = 0, busy = 0 } = data ?? initialData;

	useEffect(() => {
		const initChart = async () => {
			context.current = await init(canvas.current, context.current, t);
		};
		initChart();
	}, [t]);

	useEffect(() => {
		if (state === AsyncStatePhase.RESOLVED) {
			updateChartData(t('Offline'), [offline]);
			updateChartData(t('Available'), [available]);
			updateChartData(t('Away'), [away]);
			updateChartData(t('Busy'), [busy]);
		}
	}, [available, away, busy, offline, state, t, updateChartData]);

	return <Chart ref={canvas} {...props} />;
};

export default AgentStatusChart;
