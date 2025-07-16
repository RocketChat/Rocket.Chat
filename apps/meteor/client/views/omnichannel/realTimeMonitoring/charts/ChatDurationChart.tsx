import type { Box } from '@rocket.chat/fuselage';
import type { OperationParams } from '@rocket.chat/rest-typings';
import type * as chartjs from 'chart.js';
import type { TFunction } from 'i18next';
import type { ComponentPropsWithoutRef, MutableRefObject } from 'react';
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Chart from './Chart';
import { getMomentChartLabelsAndData } from './getMomentChartLabelsAndData';
import { getMomentCurrentLabel } from './getMomentCurrentLabel';
import { useUpdateChartData } from './useUpdateChartData';
import { drawLineChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { secondsToHHMMSS } from '../../../../../lib/utils/secondsToHHMMSS';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';

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
	params: OperationParams<'GET', '/v1/livechat/analytics/dashboards/charts/timings'>;
	reloadRef: MutableRefObject<{ [x: string]: () => void }>;
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'data'>;

const ChatDurationChart = ({ params, reloadRef, ...props }: ChatDurationChartProps) => {
	const { t } = useTranslation();

	const canvas = useRef<HTMLCanvasElement | null>(null);
	const context = useRef<chartjs.Chart<'line'>>();

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		t,
		init,
	});

	const { value: data, phase: state, reload } = useEndpointData('/v1/livechat/analytics/dashboards/charts/timings', { params });

	reloadRef.current.chatDurationChart = reload;

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
		if (state === AsyncStatePhase.RESOLVED) {
			const label = getMomentCurrentLabel();
			updateChartData(label, [avg, longest]);
		}
	}, [avg, longest, state, t, updateChartData]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default ChatDurationChart;
