import type { OperationParams } from '@rocket.chat/rest-typings';
import type { TranslationContextValue } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { Chart as ChartType } from 'chart.js';
import type { MutableRefObject } from 'react';
import React, { useRef, useEffect } from 'react';

import { drawLineChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { secondsToHHMMSS } from '../../../../../lib/utils/secondsToHHMMSS';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
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
};

const ResponseTimesChart = ({ params, reloadRef, ...props }: ResponseTimesChartProps) => {
	const t = useTranslation();

	const canvas: MutableRefObject<HTMLCanvasElement | null> = useRef(null);
	const context: MutableRefObject<ChartType | undefined> = useRef();

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
			if (canvas?.current) {
				context.current = await init(canvas.current, context.current, t);
			}
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
