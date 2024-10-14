import { useTranslation } from '@rocket.chat/ui-contexts';
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
		title([ctx]) {
			const { dataset } = ctx;
			return dataset.label;
		},
		label(ctx) {
			const { dataset, dataIndex } = ctx;
			return `${dataset.label}: ${secondsToHHMMSS(dataset.data[dataIndex])}`;
		},
	},
};
const init = (canvas, context, t) =>
	drawLineChart(canvas, context, [t('Avg_chat_duration'), t('Longest_chat_duration')], labels, [initialData, initialData.slice()], {
		legends: true,
		anim: true,
		smallTicks: true,
		displayColors: false,
		tooltipCallbacks,
	});

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
