import type { Box } from '@rocket.chat/fuselage';
import type { OperationParams } from '@rocket.chat/rest-typings';
import type { TranslationContextValue } from '@rocket.chat/ui-contexts';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { Chart as ChartType } from 'chart.js';
import type { ComponentProps, MutableRefObject } from 'react';
import React, { useRef, useEffect, useMemo, useState } from 'react';

import { drawLineChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { secondsToHHMMSS } from '../../../../../lib/utils/secondsToHHMMSS';
import Chart from './Chart';
import { getMomentChartLabelsAndData } from './getMomentChartLabelsAndData';
import { getMomentCurrentLabel } from './getMomentCurrentLabel';
import { useUpdateChartData } from './useUpdateChartData';

const [labels, initialData] = getMomentChartLabelsAndData();
const tooltipCallbacks = {
	callbacks: {
		title([ctx]: { dataset: { label: string } }[]) {
			const { dataset } = ctx;
			return dataset.label;
		},
		label(ctx: { dataset: { label: string; data: string[] }; dataIndex: number }) {
			const { dataset, dataIndex } = ctx;
			return `${dataset.label}: ${secondsToHHMMSS(dataset.data[dataIndex])}`;
		},
	},
};
const init = (canvas: HTMLCanvasElement, context: ChartType | undefined, t: TranslationContextValue['translate']) =>
	drawLineChart(canvas, context, [t('Avg_chat_duration'), t('Longest_chat_duration')], labels, [initialData, initialData.slice()], {
		legends: true,
		anim: true,
		smallTicks: true,
		displayColors: false,
		tooltipCallbacks,
	});

const defaultData = {
	chatDuration: {
		avg: 0,
		longest: 0,
	},
};

type ChatDurationChartProps = {
	params: OperationParams<'GET', '/v1/livechat/analytics/dashboards/charts/timings'>;
	reloadFrequency: number;
} & ComponentProps<typeof Box>;

const ChatDurationChart = ({ params, reloadFrequency, ...props }: ChatDurationChartProps) => {
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

	const getChartData = useEndpoint('GET', '/v1/livechat/analytics/dashboards/charts/timings');

	const { data, isLoading } = useQuery(['ChatDurationChart', memoizedParams], async () => getChartData(memoizedParams), {
		refetchInterval: reloadFrequency * 1000,
	});

	const { avg, longest } = data?.chatDuration ?? defaultData.chatDuration;

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
			const label = getMomentCurrentLabel();
			updateChartData(label, [avg, longest]);
		}
	}, [avg, data, isInitialized, isLoading, longest, t, updateChartData]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default ChatDurationChart;
