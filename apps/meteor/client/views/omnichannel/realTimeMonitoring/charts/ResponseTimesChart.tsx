import type { Box } from '@rocket.chat/fuselage';
import type { OperationParams } from '@rocket.chat/rest-typings';
import type * as chartjs from 'chart.js';
import type { TFunction } from 'i18next';
import type { MutableRefObject, ComponentPropsWithoutRef } from 'react';
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
	drawLineChart(
		canvas,
		context,
		[t('Avg_reaction_time'), t('Longest_reaction_time'), t('Avg_response_time'), t('Longest_response_time')],
		labels,
		[initialData, initialData.slice(), initialData.slice(), initialData.slice()],
		{ legends: true, anim: true, smallTicks: true, displayColors: false, tooltipCallbacks },
	);

type ResponseTimesChartProps = {
	params: OperationParams<'GET', '/v1/livechat/analytics/dashboards/charts/timings'>;
	reloadRef: MutableRefObject<{ [x: string]: () => void }>;
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'data'>;

const ResponseTimesChart = ({ params, reloadRef, ...props }: ResponseTimesChartProps) => {
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

	reloadRef.current.responseTimesChart = reload;

	const {
		reaction: { avg: reactionAvg, longest: reactionLongest },
		response: { avg: responseAvg, longest: responseLongest },
	} = data ?? {
		reaction: {
			avg: 0,
			longest: 0,
		},
		response: {
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
			updateChartData(label, [reactionAvg, reactionLongest, responseAvg, responseLongest]);
		}
	}, [reactionAvg, reactionLongest, responseAvg, responseLongest, state, t, updateChartData]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default ResponseTimesChart;
