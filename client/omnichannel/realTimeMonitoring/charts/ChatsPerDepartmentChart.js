import React, { useRef, useEffect } from 'react';

import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../hooks/useEndpointDataExperimental';
import { useTranslation } from '../../../contexts/TranslationContext';
import { drawLineChart } from '../../../../app/livechat/client/lib/chartHandler';

const initialData = {
	departments: {},
};

const init = (canvas, context, t) => drawLineChart(
	canvas,
	context,
	[t('Open'), t('Closed')],
	[],
	[[], []],
	{ legends: true, anim: true, smallTicks: true },
);

const ChatsPerDepartmentChart = ({ params, reloadRef, ...props }) => {
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
		'livechat/analytics/dashboards/charts/chats-per-department',
		params,
	);

	reloadRef.current.chatsPerDepartmentChart = reload;

	const {
		departments = {},
	} = data ?? initialData;

	useEffect(() => {
		const initChart = async () => {
			context.current = await init(canvas.current, context.current, t);
		};
		initChart();
	}, [t]);

	useEffect(() => {
		if (state === ENDPOINT_STATES.DONE) {
			Object.entries(departments).forEach(([name, value]) => {
				updateChartData(name, [value.open, value.closed]);
			});
		}
	}, [departments, state, t, updateChartData]);

	return <Chart ref={canvas} {...props}/>;
};

export default ChatsPerDepartmentChart;
