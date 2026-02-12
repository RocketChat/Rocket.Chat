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
import { useChartContext } from './useChartContext';
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
	drawLineChart(
		canvas,
		context,
		[t('Avg_reaction_time'), t('Longest_reaction_time'), t('Avg_response_time'), t('Longest_response_time')],
		labels,
		[initialData, initialData.slice(), initialData.slice(), initialData.slice()],
		{ legends: true, anim: true, smallTicks: true, displayColors: false, tooltipCallbacks },
	);

type ResponseTimesChartProps = {
	departmentId: ILivechatDepartment['_id'];
	dateRange: { start: string; end: string };
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'data'>;

const ResponseTimesChart = ({ departmentId, dateRange, ...props }: ResponseTimesChartProps) => {
	const { t } = useTranslation();

	const canvas = useRef<HTMLCanvasElement | null>(null);

	const getTimings = useEndpoint('GET', '/v1/livechat/analytics/dashboards/charts/timings');
	const {
		isSuccess,
		data: { reaction: { avg: reactionAvg, longest: reactionLongest }, response: { avg: responseAvg, longest: responseLongest } } = {
			reaction: {
				avg: 0,
				longest: 0,
			},
			response: {
				avg: 0,
				longest: 0,
			},
		},
	} = useQuery({
		queryKey: omnichannelQueryKeys.analytics.timings(departmentId, dateRange),
		queryFn: () => getTimings({ departmentId, ...dateRange }),
		gcTime: 0,
	});

	const context = useChartContext({
		canvas,
		init,
		t,
	});

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		init,
		t,
	});

	useEffect(() => {
		if (!context) {
			return;
		}

		if (!isSuccess) {
			return;
		}

		const label = getMomentCurrentLabel();
		updateChartData(label, [reactionAvg, reactionLongest, responseAvg, responseLongest]);
	}, [context, reactionAvg, reactionLongest, responseAvg, responseLongest, isSuccess, t, updateChartData]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default ResponseTimesChart;
