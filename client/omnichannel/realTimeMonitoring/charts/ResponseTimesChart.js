import React, { useRef, useEffect } from 'react';

import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../hooks/useEndpointDataExperimental';
import { useTranslation } from '../../../contexts/TranslationContext';
import { drawLineChart } from '../../../../app/livechat/client/lib/chartHandler';
import { getMomentChartLabelsAndData } from './getMomentChartLabelsAndData';
import { getMomentCurrentLabel } from './getMomentCurrentLabel';

const [labels, initialData] = getMomentChartLabelsAndData();

const init = (canvas, context, t) => drawLineChart(
	canvas,
	context,
	[t('Avg_reaction_time'), t('Longest_reaction_time'), t('Avg_response_time'), t('Longest_response_time')],
	labels,
	[initialData, initialData, initialData, initialData],
	{ legends: true, anim: true, smallTicks: true },
);

const ResponseTimesChart = ({ params, reloadRef, ...props }) => {
	const t = useTranslation();

	const canvas = useRef();
	const context = useRef();

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		t,
		init,
	});

	const { data, state, reload } = useEndpointDataExperimental(
		'livechat/analytics/dashboards/charts/timings',
		params,
	);

	reloadRef.current.responseTimesChart = reload;

	const {
		reaction: {
			avg: reactionAvg,
			longest: reactionLongest,
		},
		response: {
			avg: responseAvg,
			longest: responseLongest,
		},
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
			context.current = await init(canvas.current, context.current, t);
		};
		initChart();
	}, [t]);

	useEffect(() => {
		if (state === ENDPOINT_STATES.DONE) {
			const label = getMomentCurrentLabel();
			updateChartData(label, [reactionAvg, reactionLongest, responseAvg, responseLongest]);
		}
	}, [reactionAvg, reactionLongest, responseAvg, responseLongest, state, t, updateChartData]);

	return <Chart ref={canvas} {...props}/>;
};

export default ResponseTimesChart;
