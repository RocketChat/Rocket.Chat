import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useRef, useEffect } from 'react';

import { drawDoughnutChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';

const labels = ['Open', 'Queued', 'On_Hold_Chats', 'Closed'];

const initialData = {
	open: 0,
	queued: 0,
	onhold: 0,
	closed: 0,
};

const init = (canvas, context, t) =>
	drawDoughnutChart(
		canvas,
		t('Chats'),
		context,
		labels.map((l) => t(l)),
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

	const { value: data, phase: state, reload } = useEndpointData('livechat/analytics/dashboards/charts/chats', params);

	reloadRef.current.chatsChart = reload;

	const { open, queued, closed, onhold } = data ?? initialData;

	useEffect(() => {
		const initChart = async () => {
			context.current = await init(canvas.current, context.current, t);
		};
		initChart();
	}, [t]);

	useEffect(() => {
		if (state === AsyncStatePhase.RESOLVED) {
			updateChartData(t('Open'), [open]);
			updateChartData(t('Closed'), [closed]);
			updateChartData(t('On_Hold_Chats'), [onhold]);
			updateChartData(t('Queued'), [queued]);
		}
	}, [closed, open, queued, onhold, state, t, updateChartData]);

	return <Chart ref={canvas} {...props} />;
};

export default ChatsChart;
