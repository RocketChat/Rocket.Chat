import React, { useRef, useEffect } from 'react';

import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { drawLineChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { getMomentChartLabelsAndData } from './getMomentChartLabelsAndData';
import { getMomentCurrentLabel } from './getMomentCurrentLabel';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';

const [labels, initialData] = getMomentChartLabelsAndData();

const init = (canvas, context, t) => drawLineChart(
	canvas,
	context,
	[t('Avg_chat_duration'), t('Longest_chat_duration')],
	labels,
	[initialData, initialData],
	{ legends: true, anim: true, smallTicks: true },
);

const ChatDurationChart = ({ params, reloadRef, ...props }) => {
	const t = useTranslation();

	const canvas = useRef();
	const context = useRef();

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		t,
		init,
	});

	const { value: data, phase: state, reload } = useEndpointData(
		'livechat/analytics/dashboards/charts/timings',
		params,
	);

	reloadRef.current.chatDurationChart = reload;

	const {
		chatDuration: {
			avg,
			longest,
		},
	} = data ?? {
		chatDuration: {
			avg: 0,
			longest: 0,
		},
	};

	useEffect(() => {
		const initChart = async () => {
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

	return <Chart ref={canvas} {...props}/>;
};

export default ChatDurationChart;
