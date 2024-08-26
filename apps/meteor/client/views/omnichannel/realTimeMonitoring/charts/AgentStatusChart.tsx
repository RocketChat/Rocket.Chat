import type { Box } from '@rocket.chat/fuselage';
import type { OperationParams } from '@rocket.chat/rest-typings';
import type { TranslationContextValue, TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { Chart as ChartType } from 'chart.js';
import type { ComponentProps, MutableRefObject } from 'react';
import React, { useRef, useEffect, useMemo, useState } from 'react';

import { drawDoughnutChart } from '../../../../../app/livechat/client/lib/chartHandler';
import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';

const labels = ['Available', 'Away', 'Busy', 'Offline'];

const initialData = {
	available: 0,
	away: 0,
	busy: 0,
	offline: 0,
};

const init = (canvas: HTMLCanvasElement, context: ChartType | undefined, t: TranslationContextValue['translate']): Promise<ChartType> =>
	drawDoughnutChart(
		canvas,
		t('Agents'),
		context,
		labels.map((l) => t(l as TranslationKey)),
		Object.values(initialData),
	);

type AgentStatusChartsProps = {
	params: OperationParams<'GET', '/v1/livechat/analytics/dashboards/charts/agents-status'>;
	reloadFrequency: number;
} & ComponentProps<typeof Box>;

const AgentStatusChart = ({ params, reloadFrequency, ...props }: AgentStatusChartsProps) => {
	const t = useTranslation();

	const canvas: MutableRefObject<HTMLCanvasElement | null> = useRef(null);
	const context: MutableRefObject<ChartType | undefined> = useRef();
	const [isInitialized, setIsInitialized] = useState(false);

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		t,
		init,
	});

	const memoizedParams = useMemo(() => params, [params]);

	const getChartData = useEndpoint('GET', '/v1/livechat/analytics/dashboards/charts/agents-status');

	const { data, isLoading } = useQuery(['AgentStatusChart', memoizedParams], async () => getChartData(memoizedParams), {
		refetchInterval: reloadFrequency * 1000,
	});

	const { offline = 0, available = 0, away = 0, busy = 0 } = data ?? initialData;

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
			updateChartData(t('Offline'), [offline]);
			updateChartData(t('Available'), [available]);
			updateChartData(t('Away'), [away]);
			updateChartData(t('Busy'), [busy]);
		}
	}, [context, available, away, busy, isLoading, offline, t, updateChartData, isInitialized]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default AgentStatusChart;
