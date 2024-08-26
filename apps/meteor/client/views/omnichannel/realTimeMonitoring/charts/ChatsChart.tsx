import type { Box } from '@rocket.chat/fuselage';
import type { OperationParams } from '@rocket.chat/rest-typings';
import type { TranslationContextValue, TranslationKey } from '@rocket.chat/ui-contexts';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { Chart as ChartType } from 'chart.js';
import type { ComponentProps, MutableRefObject } from 'react';
import React, { useRef, useEffect, useState, useMemo } from 'react';

import { drawDoughnutChart } from '../../../../../app/livechat/client/lib/chartHandler';
import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';

const labels = ['Open', 'Queued', 'On_Hold_Chats', 'Closed'];

const initialData = {
	open: 0,
	queued: 0,
	onhold: 0,
	closed: 0,
};

const init = (canvas: HTMLCanvasElement, context: ChartType | undefined, t: TranslationContextValue['translate']) =>
	drawDoughnutChart(
		canvas,
		t('Chats'),
		context,
		labels.map((l) => t(l as TranslationKey)),
		Object.values(initialData),
	);

type ChatsChartProps = {
	params: OperationParams<'GET', '/v1/livechat/analytics/dashboards/charts/chats'>;
	reloadFrequency: number;
} & ComponentProps<typeof Box>;

const ChatsChart = ({ params, reloadFrequency, ...props }: ChatsChartProps) => {
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

	const getChartData = useEndpoint('GET', '/v1/livechat/analytics/dashboards/charts/chats');

	const { data, isLoading } = useQuery(['ChatsChart', memoizedParams], async () => getChartData(memoizedParams), {
		refetchInterval: reloadFrequency * 1000,
	});

	const { open, queued, closed, onhold } = data ?? initialData;

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
			updateChartData(t('Open'), [open]);
			updateChartData(t('Closed'), [closed]);
			updateChartData(t('On_Hold_Chats'), [onhold]);
			updateChartData(t('Queued'), [queued]);
		}
	}, [closed, open, queued, onhold, t, updateChartData, isLoading, isInitialized]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default ChatsChart;
