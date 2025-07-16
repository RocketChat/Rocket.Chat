import type { Box } from '@rocket.chat/fuselage';
import type { OperationParams } from '@rocket.chat/rest-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type * as chartjs from 'chart.js';
import type { TFunction } from 'i18next';
import type { ComponentPropsWithoutRef, MutableRefObject } from 'react';
import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Chart from './Chart';
import { useUpdateChartData } from './useUpdateChartData';
import { drawDoughnutChart } from '../../../../../app/livechat/client/lib/chartHandler';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';

const labels = ['Open', 'Queued', 'On_Hold_Chats', 'Closed'];

const initialData = {
	open: 0,
	queued: 0,
	onhold: 0,
	closed: 0,
};

const init = (canvas: HTMLCanvasElement, context: chartjs.Chart<'doughnut'> | undefined, t: TFunction) =>
	drawDoughnutChart(
		canvas,
		t('Chats'),
		context,
		labels.map((l) => t(l as TranslationKey)),
		Object.values(initialData),
	);

type ChatsChartProps = {
	params: OperationParams<'GET', '/v1/livechat/analytics/dashboards/charts/chats'>;
	reloadRef: MutableRefObject<{ [x: string]: () => void }>;
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'data'>;

const ChatsChart = ({ params, reloadRef, ...props }: ChatsChartProps) => {
	const { t } = useTranslation();

	const canvas: MutableRefObject<HTMLCanvasElement | null> = useRef(null);
	const context: MutableRefObject<chartjs.Chart<'doughnut'> | undefined> = useRef();

	const updateChartData = useUpdateChartData({
		context,
		canvas,
		t,
		init,
	});

	const { value: data, phase: state, reload } = useEndpointData('/v1/livechat/analytics/dashboards/charts/chats', { params });

	reloadRef.current.chatsChart = reload;

	const { open, queued, closed, onhold } = data ?? initialData;

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
			updateChartData(t('Open'), [open]);
			updateChartData(t('Closed'), [closed]);
			updateChartData(t('On_Hold_Chats'), [onhold]);
			updateChartData(t('Queued'), [queued]);
		}
	}, [closed, open, queued, onhold, state, t, updateChartData]);

	return <Chart canvasRef={canvas} {...props} />;
};

export default ChatsChart;
