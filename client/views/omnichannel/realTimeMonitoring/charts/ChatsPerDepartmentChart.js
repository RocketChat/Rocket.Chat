import React, { useRef, useEffect } from 'react';

import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { drawLineChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';

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

	const { value: data, phase: state, reload } = useEndpointData(
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
		if (state === AsyncStatePhase.RESOLVED) {
			Object.entries(departments).forEach(([name, value]) => {
				updateChartData(name, [value.open, value.closed]);
			});
		}
	}, [departments, state, t, updateChartData]);

	return <Chart ref={canvas} {...props}/>;
};

export default ChatsPerDepartmentChart;
