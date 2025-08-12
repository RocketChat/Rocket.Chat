import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import type { Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type * as chartjs from 'chart.js';
import type { TFunction } from 'i18next';
import type { ComponentPropsWithoutRef } from 'react';
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Chart from './Chart';
import { getMomentChartLabelsAndData } from './getMomentChartLabelsAndData';
import { getMomentCurrentLabel } from './getMomentCurrentLabel';
import { useUpdateChartData } from './useUpdateChartData';
import { drawLineChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { secondsToHHMMSS } from '../../../../../lib/utils/secondsToHHMMSS';
import { omnichannelQueryKeys } from '../../../../lib/queryKeys';

const [labels, initialData] = getMomentChartLabelsAndData();
const tooltipCallbacks = {
	callbacks: {
		title([ctx]: [chartjs.TooltipItem<'line'>]) {
			const { dataset } = ctx;
			return dataset.label;
		},
		label(ctx: chartjs.TooltipItem<'line'>) {
			const { dataset, dataIndex } = ctx;
			const item = dataset.data[dataIndex];
			return `${dataset.label}: ${secondsToHHMMSS(typeof item === 'number' ? item : 0)}`;
		},
	},
};
const init = (canvas: HTMLCanvasElement, context: chartjs.Chart<'line'> | undefined, t: TFunction) =>
	drawLineChart(canvas, context, [t('Avg_chat_duration'), t('Longest_chat_duration')], labels, [initialData, initialData.slice()], {
		legends: true,
		anim: true,
		smallTicks: true,
		displayColors: false,
		tooltipCallbacks,
	});

type ChatDurationChartProps = {
	departmentId: ILivechatDepartment['_id'];
	dateRange: { start: string; end: string };
} & ComponentPropsWithoutRef<typeof Box>;

const ChatDurationChart = ({ departmentId, dateRange, ...props }: ChatDurationChartProps) => {
	const { t } = useTranslation();

	const canvas = useRef<HTMLCanvasElement | null>(null);
	const context = useRef<chartjs.Chart<'line'>>();

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		t,
		init,
	});

	const getTimings = useEndpoint('GET', '/v1/livechat/analytics/dashboards/charts/timings');
	const { isSuccess, data } = useQuery({
		queryKey: omnichannelQueryKeys.analytics.timings(departmentId, dateRange),
		queryFn: () => getTimings({ departmentId, ...dateRange }),
	});

	const {
		chatDuration: { avg, longest },
	} = data ?? {
		chatDuration: {
			avg: 0,
			longest: 0,
		},
	};

	useEffect(() => {
		const initChart = async () => {
			if (!canvas.current) {
				return;
			}

			context.current = await init(canvas.current, context.current, t);
		};
		initChart();
	}, [t]);

	useEffect(() => {
		if (!isSuccess) return;

		const label = getMomentCurrentLabel();
		updateChartData(label, [avg, longest]);
	}, [avg, longest, isSuccess, t, updateChartData]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default ChatDurationChart;
