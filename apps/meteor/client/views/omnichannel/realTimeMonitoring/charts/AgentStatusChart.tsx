import type { OperationParams } from '@rocket.chat/rest-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { Chart as ChartType } from 'chart.js';
import type { TFunction } from 'i18next';
import type { MutableRefObject } from 'react';
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

const init = (canvas: HTMLCanvasElement, context: undefined, t: TFunction) =>
	drawDoughnutChart(
		canvas,
		t('Agents'),
		context,
		labels.map((l) => t(l)),
		Object.values(initialData),
	);

type AgentStatusChartsProps = {
	params: OperationParams<'GET', '/v1/livechat/analytics/dashboards/charts/agents-status'>;
	reloadRef: MutableRefObject<{ [x: string]: () => void }>;
};

const AgentStatusChart = ({ params, reloadRef, ...props }: AgentStatusChartsProps) => {
	const t = useTranslation();

	const canvas = useRef<HTMLCanvasElement | null>(null);
	const context = useRef<ChartType | null>(null);

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		t,
		init,
	});

	const { value: data, phase: state, reload } = useEndpointData('/v1/livechat/analytics/dashboards/charts/agents-status', { params });

	reloadRef.current.agentStatusChart = reload;

	const { offline = 0, available = 0, away = 0, busy = 0 } = data ?? initialData;

	useEffect(() => {
		const initChart = async () => {
			context.current = await init(canvas.current, context.current, t);
		};
		initChart();
	}, [t]);

	useEffect(() => {
		if (state === AsyncStatePhase.RESOLVED && context.current) {
			updateChartData(t('Offline'), [offline]);
			updateChartData(t('Available'), [available]);
			updateChartData(t('Away'), [away]);
			updateChartData(t('Busy'), [busy]);
		}
	}, [available, away, busy, offline, state, t, updateChartData]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default AgentStatusChart;
