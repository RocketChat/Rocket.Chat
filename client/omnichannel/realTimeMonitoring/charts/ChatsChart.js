import React, { useRef, useEffect } from 'react';

import Chart from './Chart';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../hooks/useEndpointDataExperimental';
import { useTranslation } from '../../../contexts/TranslationContext';
import { drawDoughnutChart } from '../../../../app/livechat/client/lib/chartHandler';
import { useUpdateChartData } from './useUpdateChartData';

const labels = [
	'Open',
	'Queued',
	'Closed',
];

const initialData = {
	open: 0,
	queued: 0,
	closed: 0,
};

const init = (canvas, context, t) => drawDoughnutChart(
	canvas,
	t('Chats'),
	context,
	labels,
	Object.values(initialData),
);

const ChatsChart = ({ params, reloadRef, ...props }) => {
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
		'livechat/analytics/dashboards/charts/chats',
		params,
	);

	reloadRef.current.chatsChart = reload;

	const {
		open,
		queued,
		closed,
	} = data ?? initialData;

	useEffect(() => {
		const initChart = async () => {
			context.current = await init(canvas.current, context.current, t);
		};
		initChart();
	}, [t]);

	useEffect(() => {
		if (state === ENDPOINT_STATES.DONE) {
			updateChartData(t('Open'), [open]);
			updateChartData(t('Closed'), [closed]);
			updateChartData(t('Queued'), [queued]);
		}
	}, [closed, open, queued, state, t, updateChartData]);

	return <Chart ref={canvas} {...props}/>;
};

export default ChatsChart;
